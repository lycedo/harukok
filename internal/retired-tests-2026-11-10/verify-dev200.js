'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');let checks=0;
const run=(slug,v)=>require(path.join(root,'tools',slug+'.js')).calculate(v);
const eq=(a,b)=>{checks++;assert.deepEqual(a,b);},ok=(x,message)=>{checks++;assert.ok(x,message);},bad=(s,v)=>{checks++;assert.throws(()=>run(s,v));};
const slugs=['base32-converter','base58-converter','url-extractor','email-extractor','http-header-parser','sql-in-clause-generator','sql-values-generator','json-schema-generator','json-lines-converter','text-between-extractor','text-table-aligner','markdown-link-generator','html-table-generator','data-uri-parser'];
for(const slug of slugs){const html=fs.readFileSync(path.join(root,'tools',slug+'.html'),'utf8');eq((html.match(/src="\/ad-banner-isolated\.js\?v=20261027-banner"/g)||[]).length,1);ok(!/<button[^>]*>[^<]*(예시|샘플)/.test(html));eq((html.match(/<h1\b/g)||[]).length,1);ok(html.includes('https://harukok.com/tools/'+slug));const json=html.match(/type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];eq(JSON.parse(json).url,'https://harukok.com/tools/'+slug);}

// RFC 4648 known vectors, canonical padding and independent UTF-8 round trips.
const b32=[['',''],['f','MY======'],['fo','MZXQ===='],['foo','MZXW6==='],['foob','MZXW6YQ='],['fooba','MZXW6YTB'],['foobar','MZXW6YTBOI======']];
for(const[a,b]of b32){eq(run('base32-converter',{source:a,mode:'encode'}).text,b);eq(run('base32-converter',{source:b,mode:'decode'}).text,a);}
for(const s of ['MZ======','MZXW6==','MZXW6===A','MY','MY=====!','ıı======'])bad('base32-converter',{source:s,mode:'decode'});
eq(run('base32-converter',{source:'my======',mode:'decode'}).text,'f');
const unicode='\uFEFF하루😀';eq(run('base32-converter',{source:run('base32-converter',{source:unicode,mode:'encode'}).text,mode:'decode'}).text,unicode);
bad('base32-converter',{source:'\uD800',mode:'encode'});bad('base32-converter',{source:'x'.repeat(50001),mode:'encode'});

// Bitcoin Core test vectors: raw bytes, including significant leading zero bytes.
const b58=[['',''],['61','2g'],['626262','a3gV'],['636363','aPEr'],['00000000000000000000','1111111111'],['271F35A0','211111']];
for(const[a,b]of b58){eq(run('base58-converter',{source:a,mode:'encode'}).text,b);eq(run('base58-converter',{source:b,mode:'decode'}).text.replace(/ /g,''),a.toUpperCase());}
bad('base58-converter',{source:'0',mode:'encode'});bad('base58-converter',{source:'11 1',mode:'decode'});bad('base58-converter',{source:'0OIl',mode:'decode'});bad('base58-converter',{source:'00'.repeat(4097),mode:'encode'});

eq(run('url-extractor',{source:'(https://example.com/a(b)). https://example.com/a(b) http://[::1]:80/',punctuation:'trim',duplicates:'unique'}).text,'https://example.com/a(b)\nhttp://[::1]:80/');
eq(run('url-extractor',{source:'https://example.com/x! https://example.com/x!',punctuation:'keep',duplicates:'keep'}).value,'2개 주소');
eq(run('url-extractor',{source:'ftp://example.com/',punctuation:'trim',duplicates:'unique'}).value,'0개 주소');
eq(run('url-extractor',{source:'https://example.com/'+')'.repeat(90000),punctuation:'trim',duplicates:'unique'}).text,'https://example.com/');
bad('url-extractor',{source:'x',punctuation:'bad',duplicates:'unique'});
eq(run('email-extractor',{source:'a..b@example.com .a@example.com a@bad..com foo@example.com@evil.org ok+tag@example.com.',duplicates:'unique'}).text,'ok+tag@example.com');
eq(run('email-extractor',{source:'a@example.com A@example.com a@example.com',duplicates:'unique'}).value,'2개 이메일');
eq(run('email-extractor',{source:'한국foo@example.com foo@example.com한국',duplicates:'unique'}).value,'0개 이메일');
bad('email-extractor',{source:'x',duplicates:'bad'});

const headers=JSON.parse(run('http-header-parser',{source:'X-Test:  a:b:c \t\n__proto__: one\n__proto__: two\nSet-Cookie: x=1\nset-cookie: y=2'}).text);
eq(headers.headers[0].value,'a:b:c');eq(headers.byName['__proto__'],['one','two']);eq(headers.byName['set-cookie'],['x=1','y=2']);
eq(JSON.parse(run('http-header-parser',{source:'HTTP/2 200\nX: value\n\n'}).text).startLine,'HTTP/2 200');
for(const source of ['X: a\n folded','X: a\n\nbody','Bad Header: x',':method: GET','X: a\u0000b'])bad('http-header-parser',{source});

// Independently parse generated PostgreSQL E literals to recover original data.
function literals(sql){return[...sql.matchAll(/E'((?:''|\\[\s\S]|[^'])*)'/g)].map(match=>{const s=match[1];let out='';for(let i=0;i<s.length;i++){if(s[i]==="'"){assert.equal(s[++i],"'");out+="'";}else if(s[i]==='\\'){if(s[i+1]==='\\'){out+='\\';i++;}else{assert.equal(s[++i],'x');out+=String.fromCharCode(parseInt(s.slice(i+1,i+3),16));i+=2;}}else out+=s[i];}return out;});}
const hostile=["O'Reilly",'C:\\test',"x'); DROP TABLE users; --",'a\t\u0001b'];
const inText=run('sql-in-clause-generator',{source:hostile.join('\n'),column:'odd"name',duplicates:'keep'}).text;
eq(literals(inText),hostile);ok(inText.startsWith('"odd""name" IN ('));
eq(run('sql-in-clause-generator',{source:'a\n\na\n',column:'',duplicates:'unique'}).text,"IN (E'a', E'')");
eq(run('sql-in-clause-generator',{source:' ',column:'',duplicates:'keep'}).text,"IN (E' ')");
bad('sql-in-clause-generator',{source:'a\0b',column:'',duplicates:'keep'});bad('sql-in-clause-generator',{source:'x',column:'한'.repeat(22),duplicates:'keep'});
const insert=run('sql-values-generator',{name:'public.users',source:"id\tname\n9007199254740993\tO'Reilly\nNULL\t"}).text;
ok(insert.startsWith('INSERT INTO "public"."users" ("id", "name")'));eq(literals(insert),['9007199254740993',"O'Reilly",'NULL','']);
bad('sql-values-generator',{name:'a.b.c',source:'x\ny'});bad('sql-values-generator',{name:'users',source:'name\tname\na\tb'});bad('sql-values-generator',{name:'users',source:'x\ty\na'});

const schema=JSON.parse(run('json-schema-generator',{source:'{"__proto__":1,"arr":[1,"x",null],"empty":[],"big":1e1000,"fraction":1e-1000,"whole":1.00}',required:'all'}).text);
eq(schema.$schema,'https://json-schema.org/draft/2020-12/schema');eq(schema.properties['__proto__'].type,'integer');eq(schema.properties.arr.items.anyOf.map(x=>x.type),['integer','string','null']);eq(schema.properties.empty.items,{});eq(schema.properties.big.type,'integer');eq(schema.properties.fraction.type,'number');eq(schema.properties.whole.type,'integer');
ok(!Object.prototype.hasOwnProperty.call(JSON.parse(run('json-schema-generator',{source:'{"x":1}',required:'none'}).text),'required'));
for(const source of ['{"a":1,"\\u0061":2}','[1,]','"unterminated','['.repeat(34)+'0'+']'.repeat(34)])bad('json-schema-generator',{source,required:'all'});
const original='[ {"id":9007199254740993,"decimal":1.0000000000000001,"big":1e1000,"tiny":1e-1000,"s":" a \\n b "}, false, null ]';
const jsonl=run('json-lines-converter',{source:original,mode:'toLines',empty:'reject'}).text;
ok(jsonl.includes('9007199254740993'));ok(jsonl.includes('1.0000000000000001'));ok(jsonl.includes('1e1000'));ok(jsonl.endsWith('\n'));
const array=run('json-lines-converter',{source:jsonl,mode:'toArray',empty:'reject'}).text;ok(array.includes('1e-1000'));ok(array.includes('"s":" a \\n b "'));
eq(run('json-lines-converter',{source:'[]',mode:'toLines',empty:'reject'}).text,'');eq(run('json-lines-converter',{source:'',mode:'toArray',empty:'reject'}).text,'[]');
bad('json-lines-converter',{source:'[1,]',mode:'toLines',empty:'reject'});bad('json-lines-converter',{source:'1\n\n2',mode:'toArray',empty:'reject'});eq(run('json-lines-converter',{source:'1\n\n2',mode:'toArray',empty:'skip'}).value,'2개 항목');bad('json-lines-converter',{source:'\uFEFF1',mode:'toArray',empty:'reject'});bad('json-lines-converter',{source:'{"a":1,"a":2}\n',mode:'toArray',empty:'reject'});

eq(JSON.parse(run('text-between-extractor',{source:'[][][x][unfinished',from:'[',to:']',mode:'all'}).text),['','','x']);
eq(JSON.parse(run('text-between-extractor',{source:'aaa',from:'a',to:'a',mode:'all'}).text),['']);eq(JSON.parse(run('text-between-extractor',{source:'a x b y',from:' ',to:' ',mode:'first'}).text),['x']);
bad('text-between-extractor',{source:'x',from:'',to:'x',mode:'all'});
eq(run('text-table-aligner',{source:'한글\tx\na\tyy',align:'left',header:'no'}).text,'한글 | x \na    | yy');
eq(run('text-table-aligner',{source:'e\u0301\tx\na\ty',align:'right',header:'no'}).text,'e\u0301 | x\na | y');
eq(run('text-table-aligner',{source:'a\t12\n한\t1',align:'center',header:'no'}).text,'a  | 12\n한 | 1 ');
bad('text-table-aligner',{source:'a\u001Bb',align:'left',header:'no'});bad('text-table-aligner',{source:'a\tb\nc',align:'left',header:'yes'});

const markdown=run('markdown-link-generator',{source:'[x]<img>\thttps://example.com/a(b)?x=1&copy=2#\\'}).text;
ok(markdown.includes('\\[x\\]\\<img\\>'));ok(markdown.includes('&amp;copy=2'));ok(markdown.endsWith('%5C>)'));
bad('markdown-link-generator',{source:'x\thttps://u:p@example.com'});bad('markdown-link-generator',{source:'x\tjavascript:alert(1)'});bad('markdown-link-generator',{source:'name only'});
const html=run('html-table-generator',{source:'<script>\t" &\n<img onerror=x>\ttext',header:'yes',caption:'<b>caption</b>'}).text;
ok(html.includes('&lt;script&gt;'));ok(html.includes('&quot; &amp;'));ok(html.includes('&lt;img onerror=x&gt;'));ok(!html.includes('<script>'));ok(html.includes('<caption>&lt;b&gt;caption&lt;/b&gt;</caption>'));
bad('html-table-generator',{source:'a\tb\nc',header:'yes',caption:''});

eq(JSON.parse(run('data-uri-parser',{source:'data:;charset=UTF-8,%EF%BB%BF%ED%95%98'}).text).text,'\uFEFF하');
eq(JSON.parse(run('data-uri-parser',{source:'data:text/plain;base64,SGVsbG8='}).text).text,'Hello');
eq(JSON.parse(run('data-uri-parser',{source:'data:text/plain;base64,SGVsbG8%3D'}).text).text,'Hello');eq(JSON.parse(run('data-uri-parser',{source:'data:,a+b'}).text).text,'a+b');eq(JSON.parse(run('data-uri-parser',{source:'data:,'}).text).text,'');
for(const source of ['data:,%FF','data:,%G1','data:,%','data:;base64,TR==','data:;base64,TQ=','data:;base64;charset=UTF-8,TQ==','data:;charset=UTF-8;charset=UTF-8,x','data:,a#b','data:;charset=iso-8859-1,x','data:;charset=UTF-8,%ED%A0%80'])bad('data-uri-parser',{source});
console.log('PASS - 문서·개발 14개: '+checks+'개 형식·왕복·정밀도·입력경계·출력안전 검증');
