'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto, createHash } = require('node:crypto');
const { convertHtmlEntities } = require('../tools/html-entity-converter');
const { convertUnicode } = require('../tools/unicode-converter');
const { generateHash } = require('../tools/hash-generator');
const { parseQueryString } = require('../tools/query-string-parser');
const { convertTextCase } = require('../tools/text-case-converter');
const { countWordFrequency } = require('../tools/word-frequency-counter');
const { makeMarkdownTable } = require('../tools/markdown-table-generator');
const { sortTextLines } = require('../tools/text-sorter');
const { replaceLiteralText } = require('../tools/text-replacer');
const { decodeJWT } = require('../tools/jwt-decoder');
let checks = 0;
async function test(name, fn) { await fn(); checks++; console.log('PASS - ' + name); }
const fakeToken = (header,payload,signature='') => [header,payload].map(value=>Buffer.from(JSON.stringify(value)).toString('base64url')).join('.')+'.'+signature;
const fixtures = [
  {slug:'html-entity-converter',values:{source:'<p>하루콕 & 예시</p>',mode:'encode'},expected:'&lt;p&gt;하루콕 &amp; 예시&lt;/p&gt;'},
  {slug:'unicode-converter',values:{source:'하루😀',mode:'to-codepoints'},expected:'U+D558 U+B8E8 U+1F600'},
  {slug:'hash-generator',values:{source:'abc',mode:'SHA-256'},expected:'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'},
  {slug:'query-string-parser',values:{source:'?name=%ED%95%98%EB%A3%A8%EC%BD%95&tag=a&tag=b&empty='},expected:'"value": "하루콕"'},
  {slug:'text-case-converter',values:{source:'helloWorld API response',mode:'snake'},expected:'hello_world_api_response'},
  {slug:'word-frequency-counter',values:{source:'사과 바나나 사과\nApple apple'},expected:'사과\t2'},
  {slug:'markdown-table-generator',values:{source:'이름\t수량\n사과\t3\n바나나\t2',mode:'left'},expected:'| 사과 | 3 |'},
  {slug:'text-sorter',values:{source:'10\n2\n1.5',mode:'number',direction:'asc'},expected:'1.5\n2\n10'},
  {slug:'text-replacer',values:{source:'하루콕에서 하루를 시작해요.',search:'하루',replacement:'오늘'},expected:'오늘콕에서 오늘를 시작해요.'},
  {slug:'jwt-decoder',values:{source:fakeToken({alg:'none',typ:'JWT'},{name:'예시',exp:1893456000})},expected:'"name": "예시"'}
];
function loadUI(slug, cryptoEngine=webcrypto) {
  const html = fs.readFileSync(path.join(__dirname,'../tools/'+slug+'.html'),'utf8');
  const elements = Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(([,id])=>[id,{value:'',textContent:'',hidden:true,disabled:false,checked:false,handlers:{},addEventListener(type,fn){this.handlers[type]=fn;},scrollIntoView(){},focus(){this.focused=true;},select(){this.selected=true;}}]));
  for(const [,id] of html.matchAll(/<input[^>]*id="([^"]+)"[^>]*\bchecked/g)) elements[id].checked=true;
  const clipboard={writeText:async text=>{clipboard.text=text;}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../tools/'+slug+'.js'),'utf8'), {document:{getElementById:id=>elements[id]||null},navigator:{clipboard},crypto:cryptoEngine,TextEncoder,TextDecoder,atob,btoa,Uint8Array,URLSearchParams,URL});
  return {html,e:elements,clipboard,submit:()=>elements.converter.handlers.submit({preventDefault(){}})};
}
(async()=>{
  await test('HTML escaping preserves source and decodes exactly one layer without executing markup',()=>{
    const text='<script>alert("A&B")</script>\'😀';
    assert.equal(convertHtmlEntities(convertHtmlEntities(text,'encode'),'decode'),text);
    assert.equal(convertHtmlEntities('&amp;lt; &#x1F600; &#54616; &copy;','decode'),'&lt; 😀 하 &copy;');
    assert.equal(convertHtmlEntities('&apos;&quot;&gt;&lt;&amp;','decode'),'\'"> <&'.replace(' ',''));
    for(const text of ['&#x110000;','&#55296;','&#999999999999999999999;']) assert.throws(()=>convertHtmlEntities(text,'decode'));
    assert.throws(()=>convertHtmlEntities('x','bad')); assert.throws(()=>convertHtmlEntities('x'.repeat(200001),'encode'));
  });
  await test('Unicode scalar and JavaScript escape round trips include astral characters and reject lone surrogates',()=>{
    for(const text of ['하루😀','A\n\t\\','\0','𝄞𐀀\uFFFF']) {
      assert.equal(convertUnicode(convertUnicode(text,'to-codepoints'),'from-codepoints'),text);
      assert.equal(convertUnicode(convertUnicode(text,'to-escape'),'from-escape'),text);
    }
    assert.equal(convertUnicode('\\uD83D\\uDE00','from-escape'),'😀');
    for(const [text,mode] of [['U+110000','from-codepoints'],['U+D800','from-codepoints'],['\\uD800','from-escape'],['\\u{D800}','from-escape'],['a','from-escape'],['U+G123','from-codepoints'],['\uD800','to-codepoints'],['x','bad']]) assert.throws(()=>convertUnicode(text,mode));
  });
  await test('SHA-2 matches independent Node hashes, standard empty/abc vectors and UTF-8',async()=>{
    for(const algorithm of ['SHA-256','SHA-384','SHA-512']) for(const text of ['','abc','하루😀\r\n']) assert.equal(await generateHash(text,algorithm,webcrypto),createHash(algorithm.replace('-','').toLowerCase()).update(text,'utf8').digest('hex'));
    assert.equal(await generateHash('', 'SHA-256',webcrypto),'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    await assert.rejects(generateHash('x','MD5',webcrypto)); await assert.rejects(generateHash('x','SHA-256',null)); await assert.rejects(generateHash('x'.repeat(200001),'SHA-256',webcrypto));
  });
  await test('Query parsing preserves duplicate/empty keys, plus spaces, Unicode and ignores fragments',()=>{
    assert.deepEqual(parseQueryString('https://example.com/p?x=1&x=2&empty=&=v&q=%ED%95%98%EB%A3%A8+%2B#ignored'),[{key:'x',value:'1'},{key:'x',value:'2'},{key:'empty',value:''},{key:'',value:'v'},{key:'q',value:'하루 +'}]);
    assert.deepEqual(parseQueryString('?a=b=c'),[{key:'a',value:'b=c'}]);
    assert.deepEqual(parseQueryString('https://example.com/p'),[]);
    for(const text of ['?a=%G0','?a=%FF','ftp://example.com?a=1','?a=%E2%82'])assert.throws(()=>parseQueryString(text));
    assert.throws(()=>parseQueryString(Array(2001).fill('x=1').join('&')));
  });
  await test('Case conversion distinguishes original text from identifier word splitting',()=>{
    assert.equal(convertTextCase('Hello\nWorld!','lower'),'hello\nworld!');
    assert.equal(convertTextCase('HTTPServer helloWorld','snake'),'http_server_hello_world');
    assert.equal(convertTextCase('hello-world API','camel'),'helloWorldApi');
    assert.equal(convertTextCase('hello-world API','pascal'),'HelloWorldApi');
    assert.equal(convertTextCase('hello_world','kebab'),'hello-world');
    assert.equal(convertTextCase('HELLO world','title'),'Hello World');
    assert.equal(convertTextCase('하루콕 A1','snake'),'하루콕_a1'); assert.throws(()=>convertTextCase('a','bad'));
  });
  await test('Word frequency counts NFC words, ties in first-use order and limits only displayed entries',()=>{
    assert.deepEqual(countWordFrequency('Apple apple 사과 사과를 사과'),{total:5,unique:3,entries:[{word:'apple',count:2},{word:'사과',count:2},{word:'사과를',count:1}]});
    assert.equal(countWordFrequency('Apple apple',true).unique,2);
    assert.equal(countWordFrequency('가 '+'가'.normalize('NFD')).unique,1);
    const many=countWordFrequency(Array.from({length:1001},(_,i)=>'단어'+i).join(' ')); assert.equal(many.unique,1001);assert.equal(many.entries.length,1000);assert.equal(many.total,1001);
    assert.throws(()=>countWordFrequency('!!!'));
  });
  await test('Markdown table escapes pipes, markup and backslashes, and validates rectangular TSV',()=>{
    assert.equal(makeMarkdownTable('이름\t수량\r\n사과\t3\r\n','right'),'| 이름 | 수량 |\n| ---: | ---: |\n| 사과 | 3 |');
    const markdown=makeMarkdownTable('title\n<script> | [x] *a* \\');assert.ok(markdown.includes('&lt;script&gt;'));assert.ok(markdown.includes('\\|'));assert.ok(markdown.includes('\\['));assert.ok(markdown.includes('\\*'));assert.ok(markdown.includes('\\\\'));
    assert.throws(()=>makeMarkdownTable('a\tb\nx'));assert.throws(()=>makeMarkdownTable(Array(201).fill('a').join('\n')));assert.throws(()=>makeMarkdownTable(Array(31).fill('a').join('\t')));
  });
  await test('Numeric line sort keeps precision beyond Number and preserves equal-value source order',()=>{
    assert.equal(sortTextLines('9007199254740993\n9007199254740992\n-12.02\n-12.2\n.01\n-0','number'),' -12.2\n-12.02\n-0\n.01\n9007199254740992\n9007199254740993'.trimStart());
    assert.equal(sortTextLines('1.0\n01\n+1\n0.9','number','desc'),'1.0\n01\n+1\n0.9');
    assert.equal(sortTextLines('다\n가\n나','text'),'가\n나\n다');
    for(const text of ['NaN','1e3','1,000','1\n'])assert.throws(()=>sortTextLines(text,'number'));
    const integers=Array.from({length:101},(_,i)=>String(50-i));assert.deepEqual(sortTextLines(integers.join('\n'),'number').split('\n'),integers.sort((a,b)=>Number(a)-Number(b)));
  });
  await test('Literal replacement never treats regex or dollar notation as instructions',()=>{
    assert.deepEqual(replaceLiteralText('a.b $& a.b','a.b','$&'),{text:'$& $& $&',count:2});
    assert.deepEqual(replaceLiteralText('A a Aa','a','X',false),{text:'X X XX',count:4});
    assert.deepEqual(replaceLiteralText('aaaa','aa',''),{text:'',count:2});
    assert.deepEqual(replaceLiteralText('abc','z','x'),{text:'abc',count:0});
    assert.throws(()=>replaceLiteralText('abc','','x'));assert.throws(()=>replaceLiteralText('a'.repeat(1000),'a','x'.repeat(10000)));
    for(const char of '.*+?^${}()|[]\\')assert.equal(replaceLiteralText(char,char,'ok').text,'ok');
  });
  await test('JWT decoding is UTF-8 JSON only and never grants validity or executes payload text',()=>{
    const token=fakeToken({alg:'none',typ:'JWT'},{name:'예시😀',exp:1893456000,html:'<script>bad</script>'});
    const result=decodeJWT(token);assert.equal(result.payload.name,'예시😀');assert.equal(result.expiry,'2030-01-01T00:00:00.000Z');assert.equal(result.header.alg,'none');
    assert.equal(decodeJWT(fakeToken({},{exp:'123'})).expiry,'exp 값이 올바른 날짜가 아닙니다.');
    assert.equal(decodeJWT(fakeToken({},{exp:1e308})).expiry,'exp 값이 올바른 날짜가 아닙니다.');
    for(const token of ['a.b.c.d.e','%%%%.e30.','e30./w.','W10.e30.','e30.bnVsbA.','e30.e30.???'])assert.throws(()=>decodeJWT(token));
    assert.ok(!JSON.stringify(result).includes('verified'));
  });
  await test('Ten real UIs recover from errors, preserve input, copy with fallback and clear stale results',async()=>{
    for(const f of fixtures){
      const {html,e,clipboard,submit}=loadUI(f.slug);
      e.source.value='x'.repeat(200001);await submit();assert.ok(e.error.textContent,f.slug+' invalid input');
      for(const [id,value] of Object.entries(f.values))e[id].value=value;
      await submit();assert.equal(e.error.textContent,'',f.slug+' recovery');assert.equal(e.result.hidden,false,f.slug+' visible');assert.ok(e.output.value.includes(f.expected),f.slug+' correct result');
      const original=e.source.value;await e.copy.handlers.click();assert.equal(clipboard.text,e.output.value);
      clipboard.writeText=async()=>{throw new Error('denied');};await e.copy.handlers.click();assert.equal(e.output.selected,true);assert.match(e['copy-status'].textContent,/선택해 복사/);
      let finish;clipboard.writeText=()=>new Promise(resolve=>{finish=resolve;});const copying=e.copy.handlers.click();e.converter.handlers.input();finish();await copying;assert.equal(e.result.hidden,true);assert.equal(e.output.value,'');assert.equal(e['copy-status'].textContent,'');assert.equal(e.source.value,original);
      assert.equal((html.match(/src="\/ad-banner-isolated\.js\?v=20261027-banner"/g)||[]).length,1);
      assert.ok(!/<button[^>]*>[^<]*(?:예시|먼저 해보기)/.test(html));assert.match(html,/<textarea id="source"[^>]*placeholder="[^"]+"[^>]*><\/textarea>/);assert.match(html,/<details class="tool-notes">/);
      assert.ok(!fs.readFileSync(path.join(__dirname,'../tools/'+f.slug+'.js'),'utf8').includes('innerHTML'));
    }
  });
  await test('Async hash computation cannot restore an invalidated result',async()=>{
    let finish;const engine={subtle:{digest:()=>new Promise(resolve=>{finish=resolve;})}};
    const {e,submit}=loadUI('hash-generator',engine);e.source.value='abc';e.mode.value='SHA-256';const pending=submit();assert.equal(e.run.disabled,true);e.converter.handlers.input();finish(new Uint8Array([1,2,3]).buffer);await pending;assert.equal(e.result.hidden,true);assert.equal(e.output.value,'');assert.equal(e.error.textContent,'');assert.equal(e.run.disabled,false);
  });
  await test('Decode modes change only the placeholder to a valid example',async()=>{
    const html=loadUI('html-entity-converter');html.e.source.value='원문 유지';html.e.mode.value='decode';html.e.mode.handlers.change();assert.ok(html.e.source.placeholder.includes('&lt;'));assert.equal(html.e.source.value,'원문 유지');
    const unicode=loadUI('unicode-converter');unicode.e.mode.value='from-codepoints';unicode.e.mode.handlers.change();assert.equal(convertUnicode(unicode.e.source.placeholder,'from-codepoints'),'하루😀');unicode.e.mode.value='from-escape';unicode.e.mode.handlers.change();assert.equal(convertUnicode(unicode.e.source.placeholder,'from-escape'),'하루😀');
  });
  console.log(checks+' developer-100 checks passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
