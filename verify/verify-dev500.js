'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const names=['csv-delimiter-converter','csv-column-selector','csv-row-filter','csv-sorter','csv-deduplicator','csv-joiner','csv-group-sum','csv-pivot-table','csv-cell-trimmer','csv-formula-guard','json-key-sorter','json-merge-patch','json-object-inverter','json-patch-tool','json-key-renamer','json-array-filter','json-array-sorter','json-array-grouper','json-array-projector','json-depth-analyzer','unicode-normalizer','invisible-character-inspector','hangul-jamo-converter','korean-keyboard-converter','srt-time-shifter','character-frequency-counter','caesar-cipher','anagram-checker','palindrome-checker','alphabet-position-converter','text-column-padding','text-substitution-mapper','css-unit-converter','css-transform-generator','css-animation-generator','css-triangle-generator','css-text-shadow-generator','css-filter-generator','html-meta-generator','html-iframe-generator','html-picture-generator','content-security-policy-builder','permissions-policy-builder','web-app-manifest-generator','sql-identifier-quoter','sql-like-escaper','shell-argument-quoter','regex-alternation-builder','gitignore-generator','semver-comparator','iso-duration-converter','cookie-parser','adler32-calculator','byte-frequency-analyzer','url-normalizer','url-resolver','url-origin-analyzer','ipv6-subnet-calculator','ipv4-integer-converter','http-status-lookup','mime-type-lookup','content-type-parser','email-header-decoder','quoted-printable-converter','http-range-parser'];
let checks=0;const run=(n,v)=>require(path.join(root,'tools',n+'.js')).calculate(v),eq=(a,b)=>{assert.deepEqual(a,b);checks++;},ok=x=>{assert.ok(x);checks++;},bad=(n,v)=>{assert.throws(()=>run(n,v),undefined,n+' '+JSON.stringify(v).slice(0,200));checks++;},text=(n,v)=>run(n,v).text;
eq(names.length,65);eq(new Set(names).size,65);
for(const name of names){const html=fs.readFileSync(path.join(root,'tools',name+'.html'),'utf8'),js=fs.readFileSync(path.join(root,'tools',name+'.js'),'utf8');eq((html.match(/ad-banner-isolated\.js/g)||[]).length,1);ok(html.includes('site-ui.css?v=20261104-200'));ok(html.includes('https://harukok.com/tools/'+name));ok(html.includes('20261105-500'));ok(!/<button[^>]*>[^<]*(?:예시|샘플)/.test(html));ok(!/eval\(|new Function|\.innerHTML\s*=/.test(js));ok(html.includes('application/ld+json'));}
const csv='이름,점수\r\n"하루,콕",90\r\n"두\n줄",80\r\n"따""옴",70';
const tsv=text('csv-delimiter-converter',{source:csv,from:',',to:'\t'});eq(text('csv-delimiter-converter',{source:tsv,from:'\t',to:','}),csv);
eq(text('csv-delimiter-converter',{source:'a,b\n1,',from:',',to:';'}),'a;b\r\n1;');
for(const source of ['a,a\n1,2','a,b\n1','a,b\n"x,2','a,b\n"x"oops,2','a,,b\n1,2,3','a,b\n1,a"b','a,b\n1,2,3'])bad('csv-delimiter-converter',{source,from:',',to:';'});
eq(text('csv-column-selector',{source:'a,b,c\n1,2,3',columns:'c\na'}),'c,a\r\n3,1');bad('csv-column-selector',{source:'a,b\n1,2',columns:'a\na'});bad('csv-column-selector',{source:'a,b\n1,2',columns:'no'});
eq(text('csv-row-filter',{source:'a,b\nx,01\nx,1\ny,2',column:'b',value:'1',mode:'eq'}),'a,b\r\nx,1');
eq(text('csv-row-filter',{source:'a,b\nx,9007199254740993\ny,9007199254740992',column:'b',value:'9007199254740992',mode:'gt'}),'a,b\r\nx,9007199254740993');
eq(text('csv-row-filter',{source:'a,b\nx,1.000000000001\ny,1',column:'b',value:'1.000000000001',mode:'lt'}),'a,b\r\ny,1');bad('csv-row-filter',{source:'a,b\nx,no',column:'b',value:'1',mode:'gt'});
eq(text('csv-sorter',{source:'a,b\nx,2\ny,10\nz,2',column:'b',type:'number',direction:'asc'}),'a,b\r\nx,2\r\nz,2\r\ny,10');
eq(text('csv-sorter',{source:'a\n9007199254740993\n9007199254740992',column:'a',type:'number',direction:'asc'}),'a\r\n9007199254740992\r\n9007199254740993');
eq(text('csv-deduplicator',{source:'a,b\nx,1\nx,2\nx,1',columns:''}),'a,b\r\nx,1\r\nx,2');eq(text('csv-deduplicator',{source:'a,b\nx,1\nx,2',columns:'a'}),'a,b\r\nx,1');
eq(text('csv-joiner',{source:'id,a\n1,x\n2,y',right:'id,a\n1,z',leftKey:'id',rightKey:'id'}),'id,a,오른쪽_a_1\r\n1,x,z\r\n2,y,');
bad('csv-joiner',{source:'id,a\n1,x',right:'id,b\n1,z\n1,q',leftKey:'id',rightKey:'id'});
eq(text('csv-group-sum',{source:'g,v\nA,0.1\nA,0.2\nB,-0.000000000001',group:'g',amount:'v'}),'g,v 합계\r\nA,0.3\r\nB,-0.000000000001');
eq(text('csv-group-sum',{source:'g,v\nA,999999999999999999999999999999\nA,1',group:'g',amount:'v'}),'g,v 합계\r\nA,1000000000000000000000000000000');
bad('csv-group-sum',{source:'g,v\nA,0.0000000000001',group:'g',amount:'v'});bad('csv-group-sum',{source:'g,v\nA,1e3',group:'g',amount:'v'});
eq(text('csv-pivot-table',{source:'r,c,v\na,x,0.1\na,x,0.2\nb,y,2',rows:'r',columns:'c',amount:'v'}),'r,x,y\r\na,0.3,0\r\nb,0,2');
bad('csv-pivot-table',{source:'r,c,v\na,,1',rows:'r',columns:'c',amount:'v'});bad('csv-pivot-table',{source:'r,c,v\na,r,1',rows:'r',columns:'c',amount:'v'});
eq(text('csv-cell-trimmer',{source:'a,b\n x , 2 '}),'a,b\r\nx,2');bad('csv-cell-trimmer',{source:'a, a\n1,2'});
eq(text('csv-formula-guard',{source:'a,b\n=1+1, -2\nplain,@x'}),"a,b\r\n'=1+1,' -2\r\nplain,'@x");

eq(JSON.parse(text('json-key-sorter',{source:'{"z":{"b":1,"a":2},"a":[2,1]}'})),{a:[2,1],z:{a:2,b:1}});
ok(text('json-key-sorter',{source:'{"2":2,"10":10,"1":1}'}).indexOf('"10"')<text('json-key-sorter',{source:'{"2":2,"10":10,"1":1}'}).indexOf('"2"'));
const merge=(a,b)=>JSON.parse(text('json-merge-patch',{source:JSON.stringify(a),patch:JSON.stringify(b)}));
for(const[a,b,c]of [[{a:'b'},{a:'c'},{a:'c'}],[{a:'b'},{b:'c'},{a:'b',b:'c'}],[{a:'b'},{a:null},{}],[{a:'b',b:'c'},{a:null},{b:'c'}],[{a:['b']},{a:'c'},{a:'c'}],[{a:'c'},{a:['b']},{a:['b']}],[{a:{b:'c'}},{a:{b:'d',c:null}},{a:{b:'d'}}],[{a:[{b:'c'}]},{a:[1]},{a:[1]}],['a',{a:'b'},{a:'b'}],[[1,2],{a:'b'},{a:'b'}],[{a:'b'},null,null]])eq(merge(a,b),c);
const proto=JSON.parse(text('json-merge-patch',{source:'{}',patch:'{"__proto__":{"polluted":true},"constructor":4}'}));ok(Object.hasOwn(proto,'__proto__'));eq({}.polluted,undefined);
eq(JSON.parse(text('json-object-inverter',{source:'{"a":1,"b":"1","c":1}'})),[{value:1,keys:['a','c']},{value:'1',keys:['b']}]);bad('json-object-inverter',{source:'{"a":{}}'});
const patch=(a,b)=>JSON.parse(text('json-patch-tool',{source:JSON.stringify(a),patch:JSON.stringify(b)}));
for(const[a,p,b]of [[{foo:'bar'},[{op:'add',path:'/baz',value:'qux'}],{foo:'bar',baz:'qux'}],[{foo:['bar','baz']},[{op:'add',path:'/foo/1',value:'qux'}],{foo:['bar','qux','baz']}],[{baz:'qux',foo:'bar'},[{op:'remove',path:'/baz'}],{foo:'bar'}],[{foo:['bar','qux','baz']},[{op:'remove',path:'/foo/1'}],{foo:['bar','baz']}],[{baz:'qux',foo:'bar'},[{op:'replace',path:'/baz',value:'boo'}],{baz:'boo',foo:'bar'}],[{foo:{bar:'baz',waldo:'fred'},qux:{corge:'grault'}},[{op:'move',from:'/foo/waldo',path:'/qux/thud'}],{foo:{bar:'baz'},qux:{corge:'grault',thud:'fred'}}],[{foo:['all','grass','cows','eat']},[{op:'move',from:'/foo/1',path:'/foo/3'}],{foo:['all','cows','eat','grass']}],[{foo:['bar']},[{op:'add',path:'/foo/-',value:['abc','def']}],{foo:['bar',['abc','def']]}],[{a:1},[{op:'replace',path:'',value:[1]}],[1]],[{a:{v:1}},[{op:'copy',from:'/a',path:'/b'},{op:'replace',path:'/a/v',value:2}],{a:{v:2},b:{v:1}}]])eq(patch(a,p),b);
eq(patch({'a/b':{'~c':1}},[{op:'test',path:'/a~1b/~0c',value:1}]),{'a/b':{'~c':1}});
eq(patch({a:{b:1}},[{op:'move',from:'/a',path:'/a'}]),{a:{b:1}});
const pj=JSON.parse(text('json-patch-tool',{source:'{}',patch:'[{"op":"add","path":"/__proto__","value":{"polluted":true}}]'}));ok(Object.hasOwn(pj,'__proto__'));eq({}.polluted,undefined);
for(const p of [[{op:'remove',path:''}],[{op:'add',path:'/missing/a',value:1}],[{op:'replace',path:'/no',value:2}],[{op:'move',from:'/a',path:'/a/b'}],[{op:'test',path:'/a',value:2}],[{op:'remove',path:'/~2'}],[{op:'add',path:'/a/01',value:1}],[{op:'add',path:'/a/9',value:1}],[{op:'copy',path:'/b'}]])bad('json-patch-tool',{source:'{"a":[1]}',patch:JSON.stringify(p)});
eq(JSON.parse(text('json-key-renamer',{source:'{"a":{"a":1}}',from:'a',to:'b',scope:'all'})),{b:{b:1}});bad('json-key-renamer',{source:'{"a":1,"b":2}',from:'a',to:'b',scope:'all'});
eq(JSON.parse(text('json-array-filter',{source:'[{"a":1},{"a":"1"}]',key:'a',value:'1'})),[{a:1}]);
eq(JSON.parse(text('json-array-sorter',{source:'[{"a":2,"b":1},{"a":1},{"a":2,"b":2}]',key:'a',type:'number',direction:'asc'})),[{a:1},{a:2,b:1},{a:2,b:2}]);
bad('json-array-sorter',{source:'[{"a":1},{}]',key:'a',type:'number',direction:'asc'});bad('json-array-sorter',{source:'[1,"2"]',key:'',type:'number',direction:'asc'});
eq(JSON.parse(text('json-array-grouper',{source:'[{"g":1},{"g":"1"},{"g":1}]',key:'g'})).length,2);
eq(JSON.parse(text('json-array-projector',{source:'[{"a":1,"b":2}]',keys:'b'})),[{b:2}]);bad('json-array-projector',{source:'[{}]',keys:'b'});
ok(text('json-depth-analyzer',{source:'{"a":[1,true,null]}'}).includes('전체 값: 5'));
for(const n of names.filter(s=>s.startsWith('json-')))for(const source of ['{"a":1,"a":2}','{"a":9007199254740993}','{"a":1.0000000000000001}','{"a":1e999}','{"a":1e-999}'])bad(n,{source,patch:'{}',from:'a',to:'b',scope:'all',key:'a',value:'1',type:'number',direction:'asc',keys:'a'});

eq(text('unicode-normalizer',{source:'하루',mode:'NFC'}),'하루');eq(text('unicode-normalizer',{source:'①Ａ',mode:'NFKC'}),'1A');
ok(text('invisible-character-inspector',{source:'a\u200bb',mode:'inspect'}).includes('2번째: U+200B'));eq(text('invisible-character-inspector',{source:'a\u200bb',mode:'remove'}),'ab');
eq(text('hangul-jamo-converter',{source:'값 괜찮아',mode:'initial'}),'ㄱ ㄱㅊㅇ');eq(text('hangul-jamo-converter',{source:'값',mode:'jamo'}),'ㄱㅏㅄ');
for(const ko of ['안녕하세요','값 괜찮아','하루콕','읽어요','꽃','뻐꾸기','과외','앉아','닭이','ㄱㅏ']){const en=text('korean-keyboard-converter',{source:ko,mode:'toEn'}),back=text('korean-keyboard-converter',{source:en,mode:'toKo'});eq(back,ko==='ㄱㅏ'?'가':ko);}
// Every precomposed modern Hangul syllable must survive the keyboard round trip.
for(let cp=0xac00;cp<=0xd7a3;cp++){const source=String.fromCodePoint(cp);eq(text('korean-keyboard-converter',{source:text('korean-keyboard-converter',{source,mode:'toEn'}),mode:'toKo'}),source);}
for(const n of ['unicode-normalizer','character-frequency-counter','caesar-cipher','text-substitution-mapper','quoted-printable-converter'])bad(n,{source:'\uD800',mode:'encode',shift:'1',from:'a',to:'b'});
const srt='1\n00:00:01,000 --> 00:00:02,100\n첫 줄\n둘째 줄\n\n2\n00:00:03,000 --> 00:00:03,500\n끝\n';
const shifted=text('srt-time-shifter',{source:srt,shift:'500'});ok(shifted.includes('00:00:01,500 --> 00:00:02,600'));ok(shifted.includes('첫 줄\n둘째 줄'));eq(text('srt-time-shifter',{source:shifted,shift:'-500'}),srt);
bad('srt-time-shifter',{source:srt,shift:'-1001'});bad('srt-time-shifter',{source:'1\n00:00:03,000 --> 00:00:02,000\na',shift:'0'});bad('srt-time-shifter',{source:'1\n00:60:01,000 --> 00:60:02,000\na',shift:'0'});
eq(text('character-frequency-counter',{source:'😀😀a'}),'"😀"\t2\n"a"\t1');
for(let shift=-25;shift<=25;shift++){const source='AZ az Hello!';const code=text('caesar-cipher',{source,shift:String(shift)});eq(text('caesar-cipher',{source:code,shift:String(-shift)}),source);}
ok(text('anagram-checker',{a:'résumé',b:'re\u0301sume\u0301',mode:'fold'}).includes('같은'));ok(text('palindrome-checker',{source:'A man, a plan, a canal: Panama!',mode:'fold'}).includes('회문'));bad('palindrome-checker',{source:'!!!',mode:'fold'});
eq(text('alphabet-position-converter',{source:text('alphabet-position-converter',{source:'Hello World',mode:'encode'}),mode:'decode'}),'HELLO WORLD');bad('alphabet-position-converter',{source:'27',mode:'decode'});
eq(text('text-column-padding',{source:'😀\naaa',width:'2',fill:'0',side:'start'}),'0😀\naaa');bad('text-column-padding',{source:'a',width:'2',fill:'xx',side:'start'});
eq(text('text-substitution-mapper',{source:'ab',from:'ab',to:'bc'}),'bc');bad('text-substitution-mapper',{source:'a',from:'aa',to:'bc'});

eq(text('css-unit-converter',{value:'32',from:'px',to:'rem',root:'16',font:'20',width:'1000',height:'500'}),'2rem');
eq(text('css-unit-converter',{value:'1',from:'vw',to:'vh',root:'16',font:'20',width:'1000',height:'500'}),'2vh');
bad('css-unit-converter',{value:'1e-999',from:'px',to:'rem',root:'16',font:'20',width:'1000',height:'500'});
ok(text('css-transform-generator',{x:'0',y:'0',rotate:'-90',scaleX:'-1',scaleY:'2'}).includes('scale(-1, 2)'));
ok(text('css-animation-generator',{name:'fade',duration:'1',fromOpacity:'0',toOpacity:'1',fromY:'20',toY:'0',repeat:'1'}).includes('prefers-reduced-motion'));
bad('css-animation-generator',{name:'none',duration:'1',fromOpacity:'0',toOpacity:'1',fromY:'20',toY:'0',repeat:'1'});
for(const direction of ['up','down','left','right'])ok(text('css-triangle-generator',{width:'40',height:'30',color:'#fff',direction}).includes('solid #fff'));
bad('css-text-shadow-generator',{x:'0',y:'0',blur:'-1',color:'#fff'});bad('css-text-shadow-generator',{x:'0',y:'0',blur:'0',color:'red; x:1'});
ok(text('css-filter-generator',{brightness:'100',contrast:'100',saturate:'100',grayscale:'100',blur:'2'}).includes('grayscale(100%)'));
const meta=text('html-meta-generator',{title:'</title><script>x</script>',description:'a"b',url:'https://example.com/?a=1&b=2',image:''});ok(meta.includes('&lt;script&gt;'));ok(!meta.includes('<script>'));ok(meta.includes('&amp;b=2'));
bad('html-meta-generator',{title:'a',description:'b',url:'javascript:alert(1)',image:''});
ok(text('html-iframe-generator',{url:'https://example.com/',title:'"x',width:'640',height:'360',sandbox:'strict'}).includes('title="&quot;x"'));
bad('html-picture-generator',{sources:'https://example.com/a 480\nhttps://example.com/b 480',fallback:'https://example.com/',alt:'a',sizes:'100vw'});
ok(text('content-security-policy-builder',{scripts:"'self'",styles:"'self'",images:"'self' data:",connect:'https://example.com',frame:'none'}).startsWith('Content-Security-Policy-Report-Only:'));
bad('content-security-policy-builder',{scripts:"'none' 'self'",styles:"'self'",images:"'self'",connect:"'self'",frame:'none'});
bad('content-security-policy-builder',{scripts:'https://example.com; evil',styles:"'self'",images:"'self'",connect:"'self'",frame:'none'});
ok(text('permissions-policy-builder',{camera:'none',microphone:'self',geolocation:'none',fullscreen:'all',payment:'none'}).includes('fullscreen=*'));
const manifest=JSON.parse(text('web-app-manifest-generator',{name:'a',short:'a',start:'/',color:'#fff',background:'#000',display:'standalone',icon:'https://example.com/icon.png'}));eq(manifest.start_url,'/');
bad('web-app-manifest-generator',{name:'a',short:'a',start:'//evil.example',color:'#fff',background:'#000',display:'standalone',icon:'https://example.com/icon.png'});

eq(text('sql-identifier-quoter',{source:'a"b',dialect:'postgres',mode:'literal'}),'"a""b"');eq(text('sql-identifier-quoter',{source:'a`b',dialect:'mysql',mode:'literal'}),'`a``b`');eq(text('sql-identifier-quoter',{source:'a]b',dialect:'sqlserver',mode:'literal'}),'[a]]b]');
eq(text('sql-like-escaper',{source:'a!_%',mode:'contains'}),'%a!!!_!%%');
eq(text('shell-argument-quoter',{source:"a'b",shell:'posix'}),"'a'\"'\"'b'");eq(text('shell-argument-quoter',{source:"a'b",shell:'powershell'}),"'a''b'");bad('shell-argument-quoter',{source:'a\0b',shell:'posix'});
const pattern=text('regex-alternation-builder',{source:'a+b\n[abc]\na/b',mode:'whole'});eq(pattern,'/^(?:a\\+b|\\[abc\\]|a\\/b)$/u');
ok(text('gitignore-generator',{stack:'python',os:'mac',extra:'local.json'}).includes('__pycache__/'));ok(text('gitignore-generator',{stack:'java',os:'windows',extra:''}).includes('*.class'));
const versions=['1.0.0-alpha','1.0.0-alpha.1','1.0.0-alpha.beta','1.0.0-beta','1.0.0-beta.2','1.0.0-beta.11','1.0.0-rc.1','1.0.0'];for(let i=0;i<versions.length;i++)for(let j=0;j<versions.length;j++)eq(text('semver-comparator',{a:versions[i],b:versions[j]}),versions[i]+' '+(i<j?'<':i>j?'>':'=')+' '+versions[j]);
eq(text('semver-comparator',{a:'1.0.0+abc',b:'1.0.0+xyz'}),'1.0.0+abc = 1.0.0+xyz');eq(text('semver-comparator',{a:'999999999999999999999.0.0',b:'999999999999999999998.0.0'}),'999999999999999999999.0.0 > 999999999999999999998.0.0');
for(const a of ['01.0.0','1.0','v1.0.0','1.0.0-01','1.0.0-','1.0.0+'])bad('semver-comparator',{a,b:'1.0.0'});
for(const seconds of ['0','0.001','60','3600','86400','93784.5','1000000000000']){const iso=text('iso-duration-converter',{source:seconds,mode:'toDuration'});eq(text('iso-duration-converter',{source:iso,mode:'toSeconds'}),seconds+'초');}
for(const source of ['P','PT','P1DT','P1M','P1Y','P1W','-PT1S','PT1.0001S'])bad('iso-duration-converter',{source,mode:'toSeconds'});
eq(JSON.parse(text('cookie-parser',{source:'Cookie: a=1; a=2; empty=; quote="hi"',decode:'raw'})),[{name:'a',value:'1'},{name:'a',value:'2'},{name:'empty',value:''},{name:'quote',value:'hi'}]);
eq(JSON.parse(text('cookie-parser',{source:'word=%ED%95%98%EB%A3%A8',decode:'percent'}))[0].value,'하루');bad('cookie-parser',{source:'a=%GG',decode:'percent'});bad('cookie-parser',{source:'a=1\r\nSet-Cookie: x=y',decode:'raw'});
eq(text('adler32-calculator',{source:'',mode:'text'}),'16진수: 00000001\n10진수: 1');ok(text('adler32-calculator',{source:'Wikipedia',mode:'text'}).includes('11e60398'));
eq(text('adler32-calculator',{source:'00ff1080',mode:'hex'}),text('adler32-calculator',{source:'00 ff 10 80',mode:'hex'}));bad('adler32-calculator',{source:'0G',mode:'hex'});
ok(text('byte-frequency-analyzer',{source:'00ff',mode:'hex'}).includes('엔트로피: 1.000000'));ok(text('byte-frequency-analyzer',{source:'0000',mode:'hex'}).includes('엔트로피: 0.000000'));bad('byte-frequency-analyzer',{source:'',mode:'hex'});

eq(text('url-normalizer',{source:'HTTPS://ExAmPle.Com:443/a/../b?z=2&a=1&a=0#top',query:'sort',hash:'remove'}),'https://example.com/b?a=1&a=0&z=2');
eq(text('url-resolver',{base:'https://example.com/a/b',relative:'../c'}),'https://example.com/c');bad('url-resolver',{base:'https://example.com/',relative:'javascript:alert(1)'});bad('url-resolver',{base:'https://example.com/',relative:'https://user:pass@example.com/'});
ok(text('url-origin-analyzer',{a:'https://example.com/a',b:'https://example.com:443/b'}).includes('같은 출처'));ok(text('url-origin-analyzer',{a:'https://example.com/',b:'http://example.com/'}).includes('다른 출처'));
for(const[source,prefix,network,last,count]of [['::','0','::/0','ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff','340282366920938463463374607431768211456'],['ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff','128','ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff/128','ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff','1'],['2001:db8::ffff','120','2001:db8::ff00/120','2001:db8::ffff','256'],['::ffff:192.0.2.1','128','::ffff:c000:201/128','::ffff:c000:201','1']]){const s=text('ipv6-subnet-calculator',{source,prefix});ok(s.includes('네트워크: '+network));ok(s.includes('마지막 주소: '+last));ok(s.includes('전체 주소 수: '+count));}
for(const source of [':::','1:2:3:4:5:6:7:8:9','1:2:3:4:5:6:7::8','2001:db8::%eth0','::ffff:256.0.0.1'])bad('ipv6-subnet-calculator',{source,prefix:'64'});
for(const[ip,n]of [['0.0.0.0','0'],['255.255.255.255','4294967295'],['192.168.1.1','3232235777'],['127.0.0.1','2130706433']]){eq(text('ipv4-integer-converter',{source:ip,mode:'toInt'}),n);eq(text('ipv4-integer-converter',{source:n,mode:'toIP'}),ip);}
for(const source of ['4294967296','-1','1.5'])bad('ipv4-integer-converter',{source,mode:'toIP'});bad('ipv4-integer-converter',{source:'01.2.3.4',mode:'toInt'});
ok(text('http-status-lookup',{code:'418'}).includes('(Unused)'));ok(text('http-status-lookup',{code:'599'}).includes('수록 코드가 아닙니다'));eq(text('mime-type-lookup',{source:'.avif',mode:'extension'}),'image/avif');ok(text('mime-type-lookup',{source:'image/jpeg',mode:'mime'}).includes('.jpg'));
eq(JSON.parse(text('content-type-parser',{source:'Content-Type: Text/HTML; CHARSET="utf-8"; note="a;b\\\"c"'})),{type:'text/html',parameters:{charset:'utf-8',note:'a;b"c'}});
for(const source of ['text/html; a=x; A=y','text/html; a="x','text/html\r\nX: y','text/html; a = x'])bad('content-type-parser',{source});
eq(text('email-header-decoder',{source:'=?UTF-8?B?7ZWY66Oo7L2V?='}),'하루콕');eq(text('email-header-decoder',{source:'=?UTF-8?Q?hello_world?= =?UTF-8?Q?=21?='}),'hello world!');eq(text('email-header-decoder',{source:'=?ISO-8859-1?Q?caf=E9?='}),'café');
eq(text('email-header-decoder',{source:'=?UTF-8?Q?=3D=3F?='}),'=?');bad('email-header-decoder',{source:'=?UTF-8?Q??='});
for(const source of ['=?UTF-8?B?bad?=','=?UTF-8?Q?=GG?=','=?UTF-8?Q?=FF?=','=?UNKNOWN?Q?hello?='])bad('email-header-decoder',{source});
for(const source of ['', 'Hello = world\n하루콕\r\n😀','a'.repeat(1000),'space \t']){const code=text('quoted-printable-converter',{source,mode:'encode'});ok(code.split('\r\n').every(line=>line.length<=76));eq(text('quoted-printable-converter',{source:code,mode:'decode'}),source);}
bad('quoted-printable-converter',{source:'=GG',mode:'decode'});bad('quoted-printable-converter',{source:'=FF',mode:'decode'});
eq(text('quoted-printable-converter',{source:'a \t\r\nb \t',mode:'decode'}),'a\r\nb');
for(const[source,size,expected]of [['bytes=0-99','1000','0-99 (100바이트)'],['bytes=950-','1000','950-999 (50바이트)'],['bytes=-50','1000','950-999 (50바이트)'],['bytes=-2000','1000','0-999 (1000바이트)'],['bytes=999-2000','1000','999-999 (1바이트)'],['bytes=1000-','1000','충족 불가'],['bytes=0-0','0','충족 불가'],['bytes=-0','1000','충족 불가']])ok(text('http-range-parser',{source,size}).includes(expected));
bad('http-range-parser',{source:'bytes=5-2',size:'1000'});bad('http-range-parser',{source:'items=0-1',size:'1000'});bad('http-range-parser',{source:'bytes=-',size:'1000'});
console.log('PASS - 개발·데이터 신규65개: '+checks+'개 정답·RFC벡터·정밀도·유니코드·범위·인젝션 검증');
