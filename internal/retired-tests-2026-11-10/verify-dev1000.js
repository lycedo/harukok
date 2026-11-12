'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const samples=[
  {
    "group": "csv-profile1000",
    "groupTitle": "CSV 열·집계",
    "slug": "csv-schema-profiler",
    "title": "CSV 열 자료형 분석기",
    "category": "document",
    "keywords": "CSV 열마다 빈칸·고유 값 수와 숫자 여부를 확인하세요. 숫자 열은 정확한 십진 합계와 최솟값·최댓값도 보여줍니다.",
    "fields": {
      "source": "a,b\n1,x\n2,"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "숫자 합계 3"
  },
  {
    "group": "csv-profile1000",
    "groupTitle": "CSV 열·집계",
    "slug": "csv-column-renamer",
    "title": "CSV 열 이름 바꾸기",
    "category": "document",
    "keywords": "CSV 열 이름을 대응표로 바꾸세요. 바꾼 이름이 겹치거나 비면 중단합니다.",
    "fields": {
      "source": "a,b\n1,2",
      "mapping": "a,alpha"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "alpha,b"
  },
  {
    "group": "csv-profile1000",
    "groupTitle": "CSV 열·집계",
    "slug": "csv-row-numberer",
    "title": "CSV 행 번호 추가기",
    "category": "document",
    "keywords": "CSV에 시작 번호와 간격을 정해 행 번호 열을 추가하세요. 머리글은 번호에서 제외합니다.",
    "fields": {
      "source": "a\nx\ny",
      "name": "n",
      "start": "10",
      "step": "2"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "12,y"
  },
  {
    "group": "csv-profile1000",
    "groupTitle": "CSV 열·집계",
    "slug": "csv-unpivot",
    "title": "CSV 세로 펼치기",
    "category": "document",
    "keywords": "넓게 펼친 여러 값 열을 이름·값 두 열로 세로 변환하세요. 식별 열은 각 행에 유지합니다.",
    "fields": {
      "source": "이름,월,화\n하루,1,2",
      "ids": "이름",
      "keyName": "요일",
      "valueName": "수량"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "하루,화,2"
  },
  {
    "group": "csv-profile1000",
    "groupTitle": "CSV 열·집계",
    "slug": "csv-column-frequency",
    "title": "CSV 값 빈도표",
    "category": "document",
    "keywords": "CSV 한 열의 값이 몇 번 나오는지 빈도표로 만드세요. 빈칸도 한 값으로 집계합니다.",
    "fields": {
      "source": "a\nx\nx\ny",
      "column": "a"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "x,2"
  },
  {
    "group": "csv-profile1000",
    "groupTitle": "CSV 열·집계",
    "slug": "csv-null-filler",
    "title": "CSV 빈칸 채우기",
    "category": "document",
    "keywords": "CSV에서 지정한 열의 빈 셀을 같은 값으로 채우세요. 선택한 빈칸만 바뀌고 다른 셀은 유지됩니다.",
    "fields": {
      "source": "a,b\nx,\ny,2",
      "columns": "b",
      "fill": "0"
    },
    "selects": {
      "mode": "empty"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "x,0"
  },
  {
    "group": "csv-profile1000",
    "groupTitle": "CSV 열·집계",
    "slug": "csv-cross-tab-count",
    "title": "CSV 교차 빈도표",
    "category": "document",
    "keywords": "CSV 두 열의 조합별 행 수를 교차 빈도표로 만드세요. 같은 값을 정확히 묶어 빈도만 계산합니다.",
    "fields": {
      "source": "팀,완료\nA,Y\nA,Y\nB,N",
      "rows": "팀",
      "columns": "완료"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "A,2,0"
  },
  {
    "group": "csv-profile1000",
    "groupTitle": "CSV 열·집계",
    "slug": "csv-to-sql-update",
    "title": "CSV SQL UPDATE 만들기",
    "category": "document",
    "keywords": "CSV 각 행을 키 열의 조건으로 SQL UPDATE 문장으로 바꾸세요. 값은 모두 SQL 문자열로 인용합니다.",
    "fields": {
      "source": "id,name\n1,하루",
      "table": "items",
      "key": "id"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "WHERE \"id\" = '1';"
  },
  {
    "group": "csv-shape1000",
    "groupTitle": "CSV 구조 작업",
    "slug": "csv-row-range",
    "title": "CSV 행 구간 선택기",
    "category": "document",
    "keywords": "CSV 데이터 행을 번호 구간으로 골라내세요. 첫 행인 머리글은 항상 남습니다.",
    "fields": {
      "source": "a\nx\ny\nz",
      "start": "2",
      "end": "3"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "a\r\ny\r\nz"
  },
  {
    "group": "csv-shape1000",
    "groupTitle": "CSV 구조 작업",
    "slug": "csv-split-column",
    "title": "CSV 열 나누기",
    "category": "document",
    "keywords": "CSV 한 열을 문자 구분자로 나누어 여러 열로 바꾸세요. 나뉜 칸 수가 다른 행은 빈칸으로 맞춥니다.",
    "fields": {
      "source": "a,b\nx-y,1\nz,2",
      "column": "a",
      "delimiter": "-"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "x,y,1"
  },
  {
    "group": "csv-shape1000",
    "groupTitle": "CSV 구조 작업",
    "slug": "csv-merge-columns",
    "title": "CSV 열 합치기",
    "category": "document",
    "keywords": "CSV 여러 열의 값을 구분자와 함께 합쳐 새 열에 넣으세요. 원래 열은 유지됩니다.",
    "fields": {
      "source": "a,b\nx,1",
      "columns": "a\nb",
      "delimiter": "-",
      "name": "c"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "x,1,x-1"
  },
  {
    "group": "csv-shape1000",
    "groupTitle": "CSV 구조 작업",
    "slug": "csv-column-calculator",
    "title": "CSV 두 열 산술 계산기",
    "category": "document",
    "keywords": "CSV의 두 숫자 열을 더하기·빼기·곱하기·나누기로 계산해 새 열에 넣으세요. 입력 십진수를 보존합니다.",
    "fields": {
      "source": "a,b\n0.1,0.2",
      "left": "a",
      "right": "b",
      "name": "c"
    },
    "selects": {
      "op": "add"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "0.1,0.2,0.3"
  },
  {
    "group": "csv-shape1000",
    "groupTitle": "CSV 구조 작업",
    "slug": "csv-running-total",
    "title": "CSV 누적 합계 계산기",
    "category": "document",
    "keywords": "CSV 한 숫자 열의 누적 합계를 새 열에 추가하세요. 현재 행 순서대로 정확한 십진 합계를 계산합니다.",
    "fields": {
      "source": "v\n0.1\n0.2",
      "column": "v",
      "name": "sum"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "0.2,0.3"
  },
  {
    "group": "csv-shape1000",
    "groupTitle": "CSV 구조 작업",
    "slug": "csv-cell-case-converter",
    "title": "CSV 셀 대소문자 변환기",
    "category": "document",
    "keywords": "CSV 지정 열의 영문 대소문자를 바꾸세요. 따옴표와 줄바꿈을 포함한 표 구조는 유지됩니다.",
    "fields": {
      "source": "a,b\nhello,x",
      "columns": "a"
    },
    "selects": {
      "mode": "upper"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "HELLO,x"
  },
  {
    "group": "csv-shape1000",
    "groupTitle": "CSV 구조 작업",
    "slug": "csv-anti-join",
    "title": "CSV 미일치 행 찾기",
    "category": "document",
    "keywords": "두 CSV의 키를 비교해 오른쪽 목록에 없는 왼쪽 행만 남기세요. 셀 글자를 그대로 비교합니다.",
    "fields": {
      "source": "id,name\n1,a\n2,b",
      "right": "id\n1",
      "leftKey": "id",
      "rightKey": "id"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "2,b"
  },
  {
    "group": "json-clean1000",
    "groupTitle": "JSON 정리·검사",
    "slug": "json-record-validator",
    "title": "JSON 필드 규칙 검사기",
    "category": "document",
    "keywords": "JSON 객체 배열을 필수 키·자료형 규칙으로 검사하세요. 전체 JSON Schema 대신 간단한 필드 규칙만 지원합니다.",
    "fields": {
      "source": "[{\"a\":1},{\"a\":\"x\"}]",
      "rules": "a,number,yes"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "2행 a: number 필요"
  },
  {
    "group": "json-clean1000",
    "groupTitle": "JSON 정리·검사",
    "slug": "json-prune-empty",
    "title": "JSON 빈 값 제거기",
    "category": "document",
    "keywords": "JSON의 null·빈 문자열·빈 배열·빈 객체를 재귀적으로 제거하세요. 숫자0과 false는 남습니다.",
    "fields": {
      "source": "{\"a\":null,\"b\":0,\"c\":false}"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"b\": 0"
  },
  {
    "group": "json-clean1000",
    "groupTitle": "JSON 정리·검사",
    "slug": "json-mask-fields",
    "title": "JSON 필드 가리기",
    "category": "document",
    "keywords": "JSON 전체에서 지정한 키의 값을 같은 문자열로 가리세요. 다른 키와 구조는 유지됩니다.",
    "fields": {
      "source": "{\"password\":\"secret\",\"a\":1}",
      "keys": "password",
      "mask": "***"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"password\": \"***\""
  },
  {
    "group": "json-clean1000",
    "groupTitle": "JSON 정리·검사",
    "slug": "json-key-case-converter",
    "title": "JSON 키 표기 변환기",
    "category": "document",
    "keywords": "JSON 키를 camelCase·snake_case·kebab-case로 바꾸세요. 변환 뒤 같은 키가 생기면 중단합니다.",
    "fields": {
      "source": "{\"first_name\":\"하루\"}"
    },
    "selects": {
      "mode": "camel"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"firstName\""
  },
  {
    "group": "json-clean1000",
    "groupTitle": "JSON 정리·검사",
    "slug": "json-to-env",
    "title": "JSON 환경변수 파일 만들기",
    "category": "document",
    "keywords": "최상위 JSON 객체를 따옴표로 감싼 .env 텍스트로 만드세요. 키는 환경변수 이름 규칙을 검사합니다.",
    "fields": {
      "source": "{\"PORT\":8080}"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "PORT=\"8080\""
  },
  {
    "group": "json-clean1000",
    "groupTitle": "JSON 정리·검사",
    "slug": "json-record-deduplicator",
    "title": "JSON 배열 중복 제거기",
    "category": "document",
    "keywords": "JSON 배열에서 같은 값이나 선택한 키가 같은 레코드를 하나로 줄이세요. 처음 항목을 남깁니다.",
    "fields": {
      "source": "[{\"a\":1},{\"a\":1},{\"a\":2}]",
      "key": "a"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"a\": 2"
  },
  {
    "group": "json-clean1000",
    "groupTitle": "JSON 정리·검사",
    "slug": "json-array-zip",
    "title": "JSON 배열 짝 묶기",
    "category": "document",
    "keywords": "두 JSON 배열을 같은 위치끼리 짝지으세요. 길이가 다르면 짧은 쪽까지만 또는 null 채우기를 고릅니다.",
    "fields": {
      "a": "[\"a\",\"b\"]",
      "b": "[1]"
    },
    "selects": {
      "mode": "long"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "null"
  },
  {
    "group": "json-clean1000",
    "groupTitle": "JSON 정리·검사",
    "slug": "json-array-chunker",
    "title": "JSON 배열 묶음 나누기",
    "category": "document",
    "keywords": "JSON 배열을 정한 개수씩 작은 배열로 묶으세요. 마지막 묶음에는 남은 항목이 들어갑니다.",
    "fields": {
      "source": "[1,2,3,4,5]",
      "size": "2"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "5"
  },
  {
    "group": "json-record1000",
    "groupTitle": "JSON 레코드 작업",
    "slug": "json-numeric-aggregator",
    "title": "JSON 숫자 필드 집계기",
    "category": "document",
    "keywords": "JSON 객체 배열의 숫자 키를 집계해 합계·평균·최솟값·최댓값을 확인하세요.",
    "fields": {
      "source": "[{\"v\":0.1},{\"v\":0.2}]",
      "key": "v"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "합계: 0.3"
  },
  {
    "group": "json-record1000",
    "groupTitle": "JSON 레코드 작업",
    "slug": "json-array-set-operations",
    "title": "JSON 배열 집합 연산기",
    "category": "document",
    "keywords": "두 JSON 배열의 합집합·교집합·차집합을 구하세요. 객체의 키 순서는 같음 판정에 영향을 주지 않습니다.",
    "fields": {
      "a": "[1,2,2]",
      "b": "[2,3]"
    },
    "selects": {
      "mode": "intersection"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "2"
  },
  {
    "group": "json-record1000",
    "groupTitle": "JSON 레코드 작업",
    "slug": "json-array-join",
    "title": "JSON 배열 키 결합기",
    "category": "document",
    "keywords": "두 JSON 객체 배열을 키로 왼쪽 결합하세요. 오른쪽은 중복 키를 거부하며 결과는 left·right 객체로 구분합니다.",
    "fields": {
      "a": "[{\"id\":1}]",
      "b": "[{\"id\":1,\"score\":90}]",
      "leftKey": "id",
      "rightKey": "id"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"score\": 90"
  },
  {
    "group": "json-record1000",
    "groupTitle": "JSON 레코드 작업",
    "slug": "json-array-to-object",
    "title": "JSON 배열 객체 변환기",
    "category": "document",
    "keywords": "JSON 객체 배열을 한 키의 값으로 색인한 객체로 바꾸세요. 문자열 키만 사용하며 중복은 거부합니다.",
    "fields": {
      "source": "[{\"id\":\"a\",\"v\":1}]",
      "key": "id"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"a\": {"
  },
  {
    "group": "json-record1000",
    "groupTitle": "JSON 레코드 작업",
    "slug": "json-object-to-pairs",
    "title": "JSON 객체 키·값 목록 만들기",
    "category": "document",
    "keywords": "JSON 객체를 키·값 쌍의 배열로 바꾸세요. 중첩 값도 그대로 보존합니다.",
    "fields": {
      "source": "{\"a\":1}"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"a\""
  },
  {
    "group": "json-record1000",
    "groupTitle": "JSON 레코드 작업",
    "slug": "json-leaf-value-search",
    "title": "JSON 값 위치 찾기",
    "category": "document",
    "keywords": "JSON에서 원하는 단순 값이 있는 위치를 JSON Pointer 경로로 찾으세요. 자료형까지 정확히 비교합니다.",
    "fields": {
      "source": "{\"a/b\":[1,2]}",
      "value": "2"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"/a~1b/1\""
  },
  {
    "group": "json-record1000",
    "groupTitle": "JSON 레코드 작업",
    "slug": "json-structural-skeleton",
    "title": "JSON 구조 뼈대 만들기",
    "category": "document",
    "keywords": "JSON의 단순 값을 자료형 이름으로 바꾸어 구조를 확인하세요. 객체 키와 배열 개수는 유지됩니다.",
    "fields": {
      "source": "{\"a\":1,\"b\":null}"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"a\": \"number\""
  },
  {
    "group": "json-record1000",
    "groupTitle": "JSON 레코드 작업",
    "slug": "json-record-key-coverage",
    "title": "JSON 레코드 키 누락 검사",
    "category": "document",
    "keywords": "JSON 객체 배열의 최상위 키가 몇 행에 있는지 확인하세요. 누락된 레코드 번호도 보여줍니다.",
    "fields": {
      "source": "[{\"a\":1},{}]"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "a: 1/2행 · 누락 2"
  },
  {
    "group": "xml-tools1000",
    "groupTitle": "XML 문서 작업",
    "slug": "xml-formatter",
    "title": "XML 정리기",
    "category": "document",
    "keywords": "XML의 태그·속성·엔티티를 검사하고 읽기 쉽게 정리하세요. 혼합 본문 글자와 공백은 보존합니다.",
    "fields": {
      "source": "<a><b>하루 &amp; 콕</b></a>"
    },
    "selects": {
      "mode": "pretty"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "하루 &amp; 콕"
  },
  {
    "group": "xml-tools1000",
    "groupTitle": "XML 문서 작업",
    "slug": "xml-json-converter",
    "title": "XML JSON 트리 변환기",
    "category": "document",
    "keywords": "XML을 name·attributes·children 구조의 JSON 트리로 바꾸세요. 글자와 자식 태그의 순서를 유지합니다.",
    "fields": {
      "source": "<a id=\"1\">하루<b/>콕</a>"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"name\": \"b\""
  },
  {
    "group": "xml-tools1000",
    "groupTitle": "XML 문서 작업",
    "slug": "xml-path-extractor",
    "title": "XML 태그 경로 추출기",
    "category": "document",
    "keywords": "루트부터 적은 태그 이름 경로로 XML 요소를 골라내세요. XPath 조건식 대신 단순 태그 경로만 지원합니다.",
    "fields": {
      "source": "<a><b>1</b><b>2</b></a>",
      "path": "/a/b"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "<b>2</b>"
  },
  {
    "group": "xml-tools1000",
    "groupTitle": "XML 문서 작업",
    "slug": "xml-element-counter",
    "title": "XML 태그 개수 세기",
    "category": "document",
    "keywords": "XML 태그 이름별 개수를 집계하세요. 네임스페이스 접두사까지 포함한 이름을 그대로 구분합니다.",
    "fields": {
      "source": "<a><b/><b/></a>"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "b\t2"
  },
  {
    "group": "xml-tools1000",
    "groupTitle": "XML 문서 작업",
    "slug": "xml-text-extractor",
    "title": "XML 본문 글 추출기",
    "category": "document",
    "keywords": "XML 태그를 제외한 본문 글자를 문서 순서대로 추출하세요. 엔티티와 CDATA는 실제 글자로 바뀝니다.",
    "fields": {
      "source": "<a>하루<b>콕</b>&amp;</a>"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "하루콕&"
  },
  {
    "group": "xml-tools1000",
    "groupTitle": "XML 문서 작업",
    "slug": "xml-attribute-extractor",
    "title": "XML 속성 목록 추출기",
    "category": "document",
    "keywords": "XML의 모든 속성을 태그 경로·이름·값 표로 추출하세요. 속성 값 안 줄바꿈도 CSV로 보존합니다.",
    "fields": {
      "source": "<a><b id=\"1\"/></a>"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "/a/b,id,1"
  },
  {
    "group": "xml-tools1000",
    "groupTitle": "XML 문서 작업",
    "slug": "json-xml-builder",
    "title": "JSON 트리 XML 만들기",
    "category": "document",
    "keywords": "name·attributes·children 형태의 JSON 트리에서 XML을 만드세요. 태그 이름을 검사하고 글자·속성을 안전하게 인용합니다.",
    "fields": {
      "source": "{\"name\":\"a\",\"attributes\":{\"id\":\"1\"},\"children\":[\"<&\"]}"
    },
    "selects": {
      "mode": "pretty"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "<a id=\"1\">&lt;&amp;</a>"
  },
  {
    "group": "xml-tools1000",
    "groupTitle": "XML 문서 작업",
    "slug": "xml-namespace-inspector",
    "title": "XML 네임스페이스 선언 보기",
    "category": "document",
    "keywords": "XML의 xmlns 선언을 경로별로 모아 확인하세요. 접두사 선언 목록이며 스키마 검증은 하지 않습니다.",
    "fields": {
      "source": "<a xmlns=\"urn:a\"><b xmlns:x=\"urn:x\"/></a>"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "/a/b,x,urn:x"
  },
  {
    "group": "server-code1000",
    "groupTitle": "서버·캐시 코드",
    "slug": "dockerfile-generator",
    "title": "Node Dockerfile 만들기",
    "category": "document",
    "keywords": "npm 프로젝트용 다단계 Dockerfile을 만드세요. Node 이미지·경로·포트를 직접 정하며 서버에서 실행하지 않습니다.",
    "fields": {
      "image": "24-alpine",
      "directory": "/app",
      "port": "3000"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "EXPOSE 3000"
  },
  {
    "group": "server-code1000",
    "groupTitle": "서버·캐시 코드",
    "slug": "dockerignore-generator",
    "title": "dockerignore 만들기",
    "category": "document",
    "keywords": "Node 빌드에서 제외할 파일을 .dockerignore 목록으로 만드세요. 기본 비밀 파일 패턴과 추가 패턴을 합칩니다.",
    "fields": {
      "source": "coverage\n*.log"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "coverage"
  },
  {
    "group": "server-code1000",
    "groupTitle": "서버·캐시 코드",
    "slug": "nginx-static-config-generator",
    "title": "Nginx 정적 사이트 설정 만들기",
    "category": "document",
    "keywords": "정적 사이트의 Nginx server 설정을 만드세요. 일반 파일 사이트와 SPA 새로고침 경로를 고릅니다.",
    "fields": {
      "host": "example.com",
      "root": "/var/www/site",
      "port": "80"
    },
    "selects": {
      "mode": "files"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "try_files $uri $uri/ =404;"
  },
  {
    "group": "server-code1000",
    "groupTitle": "서버·캐시 코드",
    "slug": "redirect-rule-generator",
    "title": "웹 서버 리다이렉트 규칙 만들기",
    "category": "document",
    "keywords": "한 경로를 새 URL로 보내는 Nginx·Apache 리다이렉트 규칙을 만드세요. 상태 코드는 직접 고릅니다.",
    "fields": {
      "from": "/old",
      "to": "https://example.com/new"
    },
    "selects": {
      "server": "nginx",
      "code": "301"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "return 301 \"https://example.com/new\";"
  },
  {
    "group": "server-code1000",
    "groupTitle": "서버·캐시 코드",
    "slug": "cors-header-builder",
    "title": "CORS 응답 헤더 만들기",
    "category": "document",
    "keywords": "허용 출처·메서드·헤더로 CORS 응답 헤더를 만드세요. 와일드카드 출처와 자격증명 조합은 거부합니다.",
    "fields": {
      "origin": "https://example.com",
      "methods": "GET,POST",
      "headers": "Content-Type",
      "age": "600"
    },
    "selects": {
      "credentials": "no"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "Access-Control-Allow-Methods: GET, POST"
  },
  {
    "group": "server-code1000",
    "groupTitle": "서버·캐시 코드",
    "slug": "cache-control-builder",
    "title": "Cache-Control 헤더 만들기",
    "category": "document",
    "keywords": "공개·개인 캐시와 보관 시간을 골라 Cache-Control 헤더를 만드세요. no-store는 저장 금지로 단독 출력합니다.",
    "fields": {
      "age": "3600",
      "stale": "60"
    },
    "selects": {
      "scope": "public",
      "immutable": "no"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "public, max-age=3600"
  },
  {
    "group": "server-code1000",
    "groupTitle": "서버·캐시 코드",
    "slug": "resource-hint-generator",
    "title": "HTML 리소스 힌트 만들기",
    "category": "document",
    "keywords": "preload·prefetch·preconnect·dns-prefetch link 태그를 만드세요. 리소스 종류와 출처 간 모드를 함께 설정합니다.",
    "fields": {
      "url": "https://example.com/font.woff2"
    },
    "selects": {
      "kind": "preload",
      "as": "font",
      "cross": "none"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "crossorigin=\"anonymous\""
  },
  {
    "group": "server-code1000",
    "groupTitle": "서버·캐시 코드",
    "slug": "service-worker-precache-generator",
    "title": "서비스 워커 미리 캐시 코드 만들기",
    "category": "document",
    "keywords": "선택한 공개 정적 파일만 미리 캐시하는 서비스 워커 코드를 만드세요. 생성한 코드를 직접 검토·설치해야 합니다.",
    "fields": {
      "name": "site-v1",
      "paths": "/\n/app.js"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "const CACHE = \"site-v1\";"
  },
  {
    "group": "schema-code1000",
    "groupTitle": "검색 구조화 데이터",
    "slug": "breadcrumb-jsonld-generator",
    "title": "이동 경로 JSON-LD 만들기",
    "category": "document",
    "keywords": "이름과 URL 목록으로 BreadcrumbList JSON-LD를 만드세요. 순서를 position 값에 반영합니다.",
    "fields": {
      "source": "홈,https://example.com/"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"position\": 1"
  },
  {
    "group": "schema-code1000",
    "groupTitle": "검색 구조화 데이터",
    "slug": "faq-jsonld-generator",
    "title": "FAQ JSON-LD 만들기",
    "category": "document",
    "keywords": "질문·답변 목록을 FAQPage JSON-LD로 바꾸세요. 사용자가 작성한 문장만 포함합니다.",
    "fields": {
      "source": "운영 시간은?,오전9시부터입니다."
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"@type\": \"Question\""
  },
  {
    "group": "schema-code1000",
    "groupTitle": "검색 구조화 데이터",
    "slug": "organization-jsonld-generator",
    "title": "조직 JSON-LD 만들기",
    "category": "document",
    "keywords": "조직 이름·공식 URL·로고로 Organization JSON-LD를 만드세요. 로고가 없으면 해당 속성을 생략합니다.",
    "fields": {
      "name": "하루콕",
      "url": "https://example.com/",
      "logo": ""
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"@type\": \"Organization\""
  },
  {
    "group": "schema-code1000",
    "groupTitle": "검색 구조화 데이터",
    "slug": "article-jsonld-generator",
    "title": "글 JSON-LD 만들기",
    "category": "document",
    "keywords": "글 제목·작성자·발행일·수정일로 Article JSON-LD를 만드세요. 날짜의 실제 존재와 순서를 검사합니다.",
    "fields": {
      "title": "소식",
      "url": "https://example.com/post",
      "author": "하루",
      "published": "2026-11-07",
      "modified": ""
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"datePublished\": \"2026-11-07\""
  },
  {
    "group": "schema-code1000",
    "groupTitle": "검색 구조화 데이터",
    "slug": "event-jsonld-generator",
    "title": "행사 JSON-LD 만들기",
    "category": "document",
    "keywords": "행사 이름·시간·장소로 Event JSON-LD를 만드세요. 시간대가 있는 시작·종료 시각을 확인합니다.",
    "fields": {
      "name": "모임",
      "url": "https://example.com/event",
      "start": "2026-12-01T10:00:00+09:00",
      "end": "2026-12-01T12:00:00+09:00",
      "place": "공간",
      "address": "서울"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"@type\": \"Event\""
  },
  {
    "group": "schema-code1000",
    "groupTitle": "검색 구조화 데이터",
    "slug": "product-jsonld-generator",
    "title": "상품 JSON-LD 만들기",
    "category": "document",
    "keywords": "상품명·판매가·통화·재고 상태로 Product JSON-LD를 만드세요. 별점이나 구매 후기는 추가하지 않습니다.",
    "fields": {
      "name": "노트",
      "url": "https://example.com/product",
      "price": "12000"
    },
    "selects": {
      "currency": "KRW",
      "stock": "InStock"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"price\": \"12000\""
  },
  {
    "group": "schema-code1000",
    "groupTitle": "검색 구조화 데이터",
    "slug": "video-jsonld-generator",
    "title": "영상 JSON-LD 만들기",
    "category": "document",
    "keywords": "영상 제목·설명·썸네일·업로드일·길이로 VideoObject JSON-LD를 만드세요. 영상 파일을 업로드하지 않습니다.",
    "fields": {
      "name": "소개",
      "description": "사용 화면",
      "thumbnail": "https://example.com/a.jpg",
      "uploaded": "2026-11-07T10:00:00+09:00",
      "seconds": "90",
      "url": "https://example.com/a.mp4"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"duration\": \"PT90S\""
  },
  {
    "group": "schema-code1000",
    "groupTitle": "검색 구조화 데이터",
    "slug": "local-business-jsonld-generator",
    "title": "지역 사업체 JSON-LD 만들기",
    "category": "document",
    "keywords": "사업체 이름·주소·전화·URL로 LocalBusiness JSON-LD를 만드세요. 직접 입력한 공개 정보만 반영합니다.",
    "fields": {
      "name": "공방",
      "url": "https://example.com/",
      "phone": "+82-2-1234-5678",
      "street": "예시로1",
      "city": "서울",
      "country": "KR"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"@type\": \"LocalBusiness\""
  },
  {
    "group": "html-code1000",
    "groupTitle": "HTML 부품 만들기",
    "slug": "html-form-generator",
    "title": "HTML 입력 폼 만들기",
    "category": "document",
    "keywords": "한 줄씩 적은 필드 목록으로 label이 연결된 HTML 폼을 만드세요. 폼 처리 서버 코드는 포함하지 않습니다.",
    "fields": {
      "fields": "email,이메일,email",
      "action": "https://example.com/submit"
    },
    "selects": {
      "method": "post"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "for=\"email\""
  },
  {
    "group": "html-code1000",
    "groupTitle": "HTML 부품 만들기",
    "slug": "html-select-generator",
    "title": "HTML 선택 목록 만들기",
    "category": "document",
    "keywords": "값·표시 글자 목록으로 label이 연결된 HTML select를 만드세요. 기본 선택 항목도 지정할 수 있습니다.",
    "fields": {
      "id": "fruit",
      "label": "과일",
      "options": "a,사과\nb,배",
      "selected": "b"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "value=\"b\" selected"
  },
  {
    "group": "html-code1000",
    "groupTitle": "HTML 부품 만들기",
    "slug": "html-details-generator",
    "title": "HTML 접기 영역 만들기",
    "category": "document",
    "keywords": "제목과 본문 글자로 HTML details·summary를 만드세요. 본문은 HTML 코드로 실행되지 않게 인용합니다.",
    "fields": {
      "summary": "자세히",
      "source": "<script>"
    },
    "selects": {
      "open": "no"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "&lt;script&gt;"
  },
  {
    "group": "html-code1000",
    "groupTitle": "HTML 부품 만들기",
    "slug": "html-progress-generator",
    "title": "HTML 진행률 만들기",
    "category": "document",
    "keywords": "현재 값과 최댓값으로 접근 가능한 HTML progress 코드를 만드세요. label과 백분율 글자를 함께 넣습니다.",
    "fields": {
      "id": "p",
      "label": "진행",
      "value": "25",
      "max": "100"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "25%</progress>"
  },
  {
    "group": "html-code1000",
    "groupTitle": "HTML 부품 만들기",
    "slug": "html-media-generator",
    "title": "HTML 오디오·영상 만들기",
    "category": "document",
    "keywords": "재생 컨트롤과 대체 문구가 있는 audio·video HTML을 만드세요. 자동재생은 추가하지 않습니다.",
    "fields": {
      "url": "https://example.com/a.mp4",
      "type": "video/mp4",
      "fallback": "재생 불가"
    },
    "selects": {
      "kind": "video"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "controls preload=\"metadata\""
  },
  {
    "group": "html-code1000",
    "groupTitle": "HTML 부품 만들기",
    "slug": "html-download-link-generator",
    "title": "HTML 다운로드 링크 만들기",
    "category": "document",
    "keywords": "다운로드 URL·파일 이름·링크 글자로 안전하게 인용한 HTML 다운로드 링크를 만드세요.",
    "fields": {
      "url": "https://example.com/a.pdf",
      "filename": "a.pdf",
      "label": "받기"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "download=\"a.pdf\""
  },
  {
    "group": "html-code1000",
    "groupTitle": "HTML 부품 만들기",
    "slug": "html-description-list-generator",
    "title": "HTML 설명 목록 만들기",
    "category": "document",
    "keywords": "용어와 설명 목록으로 HTML dl·dt·dd를 만드세요. 텍스트의 특수문자는 인용합니다.",
    "fields": {
      "source": "HTML,구조"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "<dt>HTML</dt>"
  },
  {
    "group": "html-code1000",
    "groupTitle": "HTML 부품 만들기",
    "slug": "html-datalist-generator",
    "title": "HTML 입력 추천 목록 만들기",
    "category": "document",
    "keywords": "직접 입력할 수 있는 HTML 입력칸에 datalist 추천 목록을 연결하세요. label·id·list를 맞춰 만듭니다.",
    "fields": {
      "id": "city",
      "label": "도시",
      "options": "서울\n부산"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "list=\"city-options\""
  },
  {
    "group": "css-layout1000",
    "groupTitle": "CSS 배치·동작",
    "slug": "css-aspect-ratio-generator",
    "title": "CSS 고정 비율 박스 만들기",
    "category": "document",
    "keywords": "가로·세로 비율을 유지하는 CSS 상자 코드를 만드세요. 최대 너비와 비율을 함께 설정합니다.",
    "fields": {
      "width": "16",
      "height": "9",
      "max": "960"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "aspect-ratio: 16 / 9;"
  },
  {
    "group": "css-layout1000",
    "groupTitle": "CSS 배치·동작",
    "slug": "css-object-fit-generator",
    "title": "CSS 이미지 맞춤 만들기",
    "category": "document",
    "keywords": "이미지 상자 크기·맞춤 방식·기준 위치로 object-fit CSS를 만드세요. 이미지가 잘리는 위치도 조정합니다.",
    "fields": {
      "width": "640",
      "height": "360",
      "x": "50",
      "y": "25"
    },
    "selects": {
      "fit": "cover"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "object-position: 50% 25%;"
  },
  {
    "group": "css-layout1000",
    "groupTitle": "CSS 배치·동작",
    "slug": "css-columns-generator",
    "title": "CSS 다단 문서 만들기",
    "category": "document",
    "keywords": "문단을 여러 단으로 배치하는 CSS를 만드세요. 단 수·최소 너비·간격을 함께 조정합니다.",
    "fields": {
      "count": "3",
      "width": "240",
      "gap": "24"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "column-count: 3;"
  },
  {
    "group": "css-layout1000",
    "groupTitle": "CSS 배치·동작",
    "slug": "css-scroll-snap-generator",
    "title": "CSS 스크롤 스냅 만들기",
    "category": "document",
    "keywords": "가로·세로 카드 목록의 스크롤 스냅 CSS를 만드세요. 이동 축·맞춤 위치·카드 크기를 고릅니다.",
    "fields": {
      "size": "300",
      "gap": "16"
    },
    "selects": {
      "axis": "x",
      "strict": "mandatory",
      "align": "start"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "scroll-snap-type: x mandatory;"
  },
  {
    "group": "css-layout1000",
    "groupTitle": "CSS 배치·동작",
    "slug": "css-sticky-header-generator",
    "title": "CSS 고정 머리글 만들기",
    "category": "document",
    "keywords": "스크롤 때 상단에 붙는 머리글 CSS를 만드세요. 위치·배경·쌓임 순서를 지정합니다.",
    "fields": {
      "top": "0",
      "z": "100",
      "color": "#fff",
      "padding": "16"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "position: sticky;"
  },
  {
    "group": "css-layout1000",
    "groupTitle": "CSS 배치·동작",
    "slug": "css-custom-property-generator",
    "title": "CSS 변수 묶음 만들기",
    "category": "document",
    "keywords": "이름·값 목록을 CSS 사용자 변수 묶음으로 바꾸세요. 값에 선언을 끼워 넣는 문자는 거부합니다.",
    "fields": {
      "source": "brand,#fff"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "--brand: #fff;"
  },
  {
    "group": "css-layout1000",
    "groupTitle": "CSS 배치·동작",
    "slug": "css-cubic-bezier-evaluator",
    "title": "CSS 베지어 시간 함수 계산기",
    "category": "document",
    "keywords": "CSS cubic-bezier의 시간 진행률에 대응하는 값을 계산하세요. x를 역으로 풀어 실제 시간 함수 값을 구합니다.",
    "fields": {
      "x1": "0",
      "y1": "0",
      "x2": "1",
      "y2": "1",
      "progress": "0.5"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "결과 진행률: 0.5"
  },
  {
    "group": "css-layout1000",
    "groupTitle": "CSS 배치·동작",
    "slug": "css-transform-origin-generator",
    "title": "CSS 변형 기준점 만들기",
    "category": "document",
    "keywords": "가로·세로 백분율과 깊이로 CSS 변형 기준점을 만드세요. 회전·확대의 중심을 지정할 때 사용합니다.",
    "fields": {
      "x": "0",
      "y": "100",
      "z": "0"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "transform-origin: 0% 100% 0px;"
  },
  {
    "group": "css-style1000",
    "groupTitle": "CSS 글자·모양",
    "slug": "css-outline-generator",
    "title": "CSS 포커스 테두리 만들기",
    "category": "document",
    "keywords": "키보드 포커스용 테두리 CSS를 만드세요. 두께·거리·색을 지정하고 focus-visible에 적용합니다.",
    "fields": {
      "width": "3",
      "offset": "3",
      "color": "#16233d"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "outline: 3px solid #16233d;"
  },
  {
    "group": "css-style1000",
    "groupTitle": "CSS 글자·모양",
    "slug": "css-border-generator",
    "title": "CSS 테두리 만들기",
    "category": "document",
    "keywords": "CSS 테두리의 두께·선 모양·색·적용 면을 한 번에 만드세요. 선택한 면만 선언합니다.",
    "fields": {
      "width": "2",
      "color": "#123"
    },
    "selects": {
      "style": "dashed",
      "side": "bottom"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "border-bottom: 2px dashed #123;"
  },
  {
    "group": "css-style1000",
    "groupTitle": "CSS 글자·모양",
    "slug": "css-text-decoration-generator",
    "title": "CSS 밑줄 꾸미기",
    "category": "document",
    "keywords": "밑줄·취소선의 색·모양·두께·간격을 CSS로 만드세요. 글자와 장식을 따로 조정합니다.",
    "fields": {
      "color": "#123",
      "width": "2",
      "offset": "4"
    },
    "selects": {
      "line": "underline",
      "style": "wavy"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "text-decoration-style: wavy;"
  },
  {
    "group": "css-style1000",
    "groupTitle": "CSS 글자·모양",
    "slug": "css-font-shorthand-generator",
    "title": "CSS 글꼴 단축 속성 만들기",
    "category": "document",
    "keywords": "글꼴 이름·기울기·굵기·크기·줄 높이를 CSS font 단축 속성으로 만드세요.",
    "fields": {
      "family": "Noto Sans KR",
      "weight": "400",
      "size": "18",
      "line": "1.5"
    },
    "selects": {
      "style": "normal"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "18px/1.5 \"Noto Sans KR\""
  },
  {
    "group": "css-style1000",
    "groupTitle": "CSS 글자·모양",
    "slug": "css-background-size-generator",
    "title": "CSS 배경 이미지 배치 만들기",
    "category": "document",
    "keywords": "배경 이미지의 크기·반복·기준 위치를 CSS로 만드세요. URL의 문자는 CSS 문자열로 인용합니다.",
    "fields": {
      "url": "https://example.com/a.jpg",
      "x": "50",
      "y": "50"
    },
    "selects": {
      "size": "cover",
      "repeat": "no-repeat"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "background-size: cover;"
  },
  {
    "group": "css-style1000",
    "groupTitle": "CSS 글자·모양",
    "slug": "css-linear-mask-generator",
    "title": "CSS 페이드 마스크 만들기",
    "category": "document",
    "keywords": "양끝이 투명해지는 CSS 마스크를 만드세요. 불투명 구간의 시작·끝과 방향을 설정합니다.",
    "fields": {
      "start": "10",
      "end": "90"
    },
    "selects": {
      "axis": "bottom"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "#000 10%, #000 90%"
  },
  {
    "group": "css-style1000",
    "groupTitle": "CSS 글자·모양",
    "slug": "css-clip-path-polygon-generator",
    "title": "CSS 다각형 자르기 만들기",
    "category": "document",
    "keywords": "백분율 좌표 목록으로 clip-path 다각형 CSS를 만드세요. 좌표는 상자 왼쪽 위를 기준으로 합니다.",
    "fields": {
      "points": "50 0\n100 100\n0 100"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "polygon(50% 0%, 100% 100%, 0% 100%)"
  },
  {
    "group": "css-style1000",
    "groupTitle": "CSS 글자·모양",
    "slug": "css-counter-list-generator",
    "title": "CSS 자동 번호 목록 만들기",
    "category": "document",
    "keywords": "자동 번호 앞뒤 글자와 시작 숫자로 CSS counter 목록을 만드세요. 항목이 늘어나도 번호가 이어집니다.",
    "fields": {
      "start": "1",
      "prefix": "제 ",
      "suffix": "장. "
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "counter-reset: item 0"
  },
  {
    "group": "paragraph-text1000",
    "groupTitle": "문단·줄 작업",
    "slug": "paragraph-sorter",
    "title": "문단 정렬기",
    "category": "document",
    "keywords": "빈 줄로 나눈 문단을 가나다·알파벳 순서로 정렬하세요. 문단 안 줄바꿈은 유지합니다.",
    "fields": {
      "source": "b\n\na"
    },
    "selects": {
      "direction": "asc"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "a\n\nb"
  },
  {
    "group": "paragraph-text1000",
    "groupTitle": "문단·줄 작업",
    "slug": "sentence-splitter",
    "title": "문장 나누기",
    "category": "document",
    "keywords": "문장을 한 줄씩 나누세요. 브라우저의 언어별 문장 경계 기능으로 구분합니다.",
    "fields": {
      "source": "안녕하세요. 반갑습니다!"
    },
    "selects": {
      "locale": "ko"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "안녕하세요.\n반갑습니다!"
  },
  {
    "group": "paragraph-text1000",
    "groupTitle": "문단·줄 작업",
    "slug": "text-acrostic-extractor",
    "title": "줄 첫 글자 모으기",
    "category": "document",
    "keywords": "각 줄의 첫 글자나 마지막 글자를 모으세요. 공백을 뺀 실제 글자와 이모지 코드포인트를 기준으로 합니다.",
    "fields": {
      "source": "하루\n루비\n콕콕"
    },
    "selects": {
      "side": "first"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "하루콕"
  },
  {
    "group": "paragraph-text1000",
    "groupTitle": "문단·줄 작업",
    "slug": "text-line-rotator",
    "title": "텍스트 줄 순환 이동",
    "category": "document",
    "keywords": "텍스트 줄을 순환 이동하세요. 양수는 아래로, 음수는 위로 옮기며 줄 내용은 유지합니다.",
    "fields": {
      "source": "a\nb\nc",
      "steps": "1"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "c\na\nb"
  },
  {
    "group": "paragraph-text1000",
    "groupTitle": "문단·줄 작업",
    "slug": "text-line-interleaver",
    "title": "두 글 목록 번갈아 합치기",
    "category": "document",
    "keywords": "두 줄 목록을 한 줄씩 번갈아 합치세요. 한쪽이 먼저 끝나면 남은 줄도 이어 붙입니다.",
    "fields": {
      "a": "a\nb",
      "b": "1\n2\n3"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "a\n1\nb\n2\n3"
  },
  {
    "group": "paragraph-text1000",
    "groupTitle": "문단·줄 작업",
    "slug": "text-line-unwrapper",
    "title": "문단 안 줄바꿈 합치기",
    "category": "document",
    "keywords": "문단 안의 강제 줄바꿈을 공백으로 합치세요. 빈 줄로 구분한 문단은 나누어 둡니다.",
    "fields": {
      "source": "a\nb\n\nc\nd"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "a b\n\nc d"
  },
  {
    "group": "paragraph-text1000",
    "groupTitle": "문단·줄 작업",
    "slug": "text-find-line-positions",
    "title": "글이 들어간 줄 찾기",
    "category": "document",
    "keywords": "찾는 글자가 들어간 줄과 줄 번호를 모으세요. 정규식 대신 입력한 글자를 그대로 찾습니다.",
    "fields": {
      "source": "abc\nx\nabc def",
      "needle": "abc"
    },
    "selects": {
      "mode": "exact"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "3\tabc def"
  },
  {
    "group": "paragraph-text1000",
    "groupTitle": "문단·줄 작업",
    "slug": "text-repeated-block-remover",
    "title": "반복 글 블록 줄이기",
    "category": "document",
    "keywords": "바로 이어서 반복되는 같은 줄 묶음을 한 번만 남기세요. 묶음 크기는 직접 지정합니다.",
    "fields": {
      "source": "a\nb\na\nb\nc",
      "size": "2"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "a\nb\nc"
  },
  {
    "group": "markdown-tools1000",
    "groupTitle": "마크다운 문서 작업",
    "slug": "markdown-text-escaper",
    "title": "마크다운 특수문자 이스케이프",
    "category": "document",
    "keywords": "글자 그대로 보이도록 마크다운 특수문자에 역슬래시를 붙이세요. HTML을 실행하거나 문서를 렌더링하지 않습니다.",
    "fields": {
      "source": "*hello* [x]"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\\*hello\\*"
  },
  {
    "group": "markdown-tools1000",
    "groupTitle": "마크다운 문서 작업",
    "slug": "markdown-heading-outline",
    "title": "마크다운 제목 목차 추출",
    "category": "document",
    "keywords": "마크다운 # 제목을 단계별 목차로 추출하세요. 코드 펜스 안 제목은 제외하며 Setext 밑줄 제목은 지원하지 않습니다.",
    "fields": {
      "source": "# 첫째\n### 셋째\n```\n# 코드\n```"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "    - 셋째"
  },
  {
    "group": "markdown-tools1000",
    "groupTitle": "마크다운 문서 작업",
    "slug": "markdown-link-extractor",
    "title": "마크다운 링크 추출기",
    "category": "document",
    "keywords": "마크다운의 기본 [이름](주소) 인라인 링크를 추출하세요. 참조형·이미지·제목 속성·코드 펜스는 제외합니다.",
    "fields": {
      "source": "[하루](https://example.com/a(b))"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "https://example.com/a(b)"
  },
  {
    "group": "markdown-tools1000",
    "groupTitle": "마크다운 문서 작업",
    "slug": "markdown-codeblock-extractor",
    "title": "마크다운 코드 블록 추출기",
    "category": "document",
    "keywords": "마크다운의 역따옴표·물결표 코드 펜스 본문을 추출하세요. 닫는 펜스가 없으면 문서 끝까지 읽습니다.",
    "fields": {
      "source": "```js\nconst x = 1;\n```"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "const x = 1;"
  },
  {
    "group": "markdown-tools1000",
    "groupTitle": "마크다운 문서 작업",
    "slug": "markdown-table-to-csv",
    "title": "마크다운 표 CSV 변환기",
    "category": "document",
    "keywords": "파이프 마크다운 표를 CSV로 바꾸세요. 열 맞춤 행과 이스케이프한 파이프를 처리합니다.",
    "fields": {
      "source": "| a | b |\n| --- | --- |\n| x\\|y | 1 |"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "x|y,1"
  },
  {
    "group": "markdown-tools1000",
    "groupTitle": "마크다운 문서 작업",
    "slug": "markdown-checklist-progress",
    "title": "마크다운 체크리스트 집계",
    "category": "document",
    "keywords": "마크다운 체크박스 목록의 완료·미완료 개수와 진행률을 계산하세요. 코드 펜스 안 목록은 제외합니다.",
    "fields": {
      "source": "- [x] a\n- [ ] b"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "진행률: 50%"
  },
  {
    "group": "markdown-tools1000",
    "groupTitle": "마크다운 문서 작업",
    "slug": "markdown-frontmatter-splitter",
    "title": "마크다운 머리말 나누기",
    "category": "document",
    "keywords": "문서 맨 앞 --- 구간과 본문을 나누세요. YAML을 해석하지 않고 원문 글자만 분리합니다.",
    "fields": {
      "source": "---\ntitle: 하루\n---\n본문"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "[본문]\n본문"
  },
  {
    "group": "markdown-tools1000",
    "groupTitle": "마크다운 문서 작업",
    "slug": "markdown-fence-generator",
    "title": "안전한 코드 블록 감싸기",
    "category": "document",
    "keywords": "본문 안 역따옴표보다 긴 코드 펜스로 글을 감싸세요. 코드 안 펜스가 있어도 블록이 닫히지 않게 만듭니다.",
    "fields": {
      "source": "```x```",
      "language": "text"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "````text"
  },
  {
    "group": "encoding-code1000",
    "groupTitle": "인코딩·웹 진단",
    "slug": "ascii85-converter",
    "title": "Ascii85 변환기",
    "category": "document",
    "keywords": "UTF-8 글자와 Adobe Ascii85 문자열을 서로 변환하세요. z 압축과 선택적 <~ ~> 감싸기를 지원합니다.",
    "fields": {
      "source": "Hello"
    },
    "selects": {
      "mode": "encode"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "<~87cURDZ~>"
  },
  {
    "group": "encoding-code1000",
    "groupTitle": "인코딩·웹 진단",
    "slug": "base45-converter",
    "title": "Base45 변환기",
    "category": "document",
    "keywords": "UTF-8 글자와 RFC9285 Base45를 서로 변환하세요. Base45 안 공백은 실제 데이터로 유지합니다.",
    "fields": {
      "source": "AB"
    },
    "selects": {
      "mode": "encode"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "BB8"
  },
  {
    "group": "encoding-code1000",
    "groupTitle": "인코딩·웹 진단",
    "slug": "base62-integer-converter",
    "title": "Base62 정수 변환기",
    "category": "document",
    "keywords": "0 이상 정수를 10진수와 Base62로 서로 바꾸세요. 알파벳 순서는 0-9·A-Z·a-z입니다.",
    "fields": {
      "source": "3843"
    },
    "selects": {
      "mode": "encode"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "zz"
  },
  {
    "group": "encoding-code1000",
    "groupTitle": "인코딩·웹 진단",
    "slug": "punycode-converter",
    "title": "퓨니코드 도메인 변환기",
    "category": "document",
    "keywords": "국제화 도메인을 xn-- ASCII 도메인과 서로 변환하세요. IDNA 정규화는 브라우저 URL 규칙을 사용합니다.",
    "fields": {
      "source": "bücher.example"
    },
    "selects": {
      "mode": "encode"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "xn--bcher-kva.example"
  },
  {
    "group": "binary-format1000",
    "groupTitle": "바이너리 자료 작업",
    "slug": "hexdump-converter",
    "title": "16진수 덤프 변환기",
    "category": "document",
    "keywords": "16진수 바이트를 오프셋·ASCII가 있는 덤프로 바꾸거나 이 도구의 덤프에서 바이트를 복원하세요.",
    "fields": {
      "source": "48 65 6c 6c 6f"
    },
    "selects": {
      "mode": "dump"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "|Hello|"
  },
  {
    "group": "binary-format1000",
    "groupTitle": "바이너리 자료 작업",
    "slug": "file-signature-inspector",
    "title": "파일 시그니처 확인기",
    "category": "document",
    "keywords": "처음 바이트의 파일 시그니처를 알려진 형식과 비교하세요. 실제 파일을 업로드하거나 보안을 판단하지 않습니다.",
    "fields": {
      "source": "89 50 4e 47 0d 0a 1a 0a"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "일치 후보: PNG"
  },
  {
    "group": "binary-format1000",
    "groupTitle": "바이너리 자료 작업",
    "slug": "varint-converter",
    "title": "Base128 Varint 변환기",
    "category": "document",
    "keywords": "64비트 정수를 Base128 Varint로 바꾸거나 복원하세요. 부호 있는 값은 ZigZag 방식을 고릅니다.",
    "fields": {
      "source": "300"
    },
    "selects": {
      "mode": "encode",
      "signed": "unsigned"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "ac 02"
  },
  {
    "group": "binary-format1000",
    "groupTitle": "바이너리 자료 작업",
    "slug": "bcd-converter",
    "title": "BCD 숫자 변환기",
    "category": "document",
    "keywords": "10진 숫자 문자열과4비트 BCD 묶음을 서로 변환하세요. 앞자리0과 숫자 개수를 보존합니다.",
    "fields": {
      "source": "0123"
    },
    "selects": {
      "mode": "encode"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "0000 0001 0010 0011"
  },
  {
    "group": "binary-format1000",
    "groupTitle": "바이너리 자료 작업",
    "slug": "gray-code-converter",
    "title": "그레이 코드 변환기",
    "category": "document",
    "keywords": "이진수와 반사 그레이 코드를 서로 변환하세요. 입력 비트 수와 앞자리0을 유지합니다.",
    "fields": {
      "source": "1011"
    },
    "selects": {
      "mode": "encode"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "1110"
  },
  {
    "group": "binary-format1000",
    "groupTitle": "바이너리 자료 작업",
    "slug": "bitmask-flags-generator",
    "title": "비트 플래그 만들기",
    "category": "document",
    "keywords": "이름 목록에서 겹치지 않는 비트 플래그를 만드세요. JavaScript BigInt 상수와16진수 JSON 중 고릅니다.",
    "fields": {
      "names": "READ\nWRITE",
      "start": "0"
    },
    "selects": {
      "format": "js"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "WRITE: 0x2n"
  },
  {
    "group": "binary-format1000",
    "groupTitle": "바이너리 자료 작업",
    "slug": "integer-byte-array-converter",
    "title": "정수 바이트 배열 변환기",
    "category": "document",
    "keywords": "1·2·4·8바이트 정수와 바이트 배열을 변환하세요. 엔디언과2의 보수 부호를 선택합니다.",
    "fields": {
      "source": "-1"
    },
    "selects": {
      "mode": "encode",
      "width": "2",
      "endian": "little",
      "signed": "yes"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "ff ff"
  },
  {
    "group": "binary-format1000",
    "groupTitle": "바이너리 자료 작업",
    "slug": "protobuf-wire-inspector",
    "title": "Protocol Buffers 바이트 분석기",
    "category": "document",
    "keywords": "Protocol Buffers 바이트의 필드 번호·와이어 형식·원시 값을 분석하세요. 스키마 없이 실제 필드 자료형은 추정하지 않습니다.",
    "fields": {
      "source": "08 96 01 12 03 66 6f 6f"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"value\": \"150\""
  },
  {
    "group": "http-fields1000",
    "groupTitle": "HTTP 응답·협상",
    "slug": "accept-header-parser",
    "title": "Accept 헤더 분석기",
    "category": "document",
    "keywords": "Accept 헤더의 미디어 범위·매개변수·q 값을 분석하세요. 높은 선호도부터 원래 순서를 유지해 보여줍니다.",
    "fields": {
      "source": "text/html, application/json;q=0.9"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"quality\": 0.9"
  },
  {
    "group": "http-fields1000",
    "groupTitle": "HTTP 응답·협상",
    "slug": "accept-language-parser",
    "title": "Accept-Language 분석기",
    "category": "document",
    "keywords": "Accept-Language의 언어 범위와 q 선호도를 분석하세요. 실제 브라우저 언어를 읽거나 바꾸지 않습니다.",
    "fields": {
      "source": "ko-KR,en-US;q=0.8"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"language\": \"ko-KR\""
  },
  {
    "group": "http-fields1000",
    "groupTitle": "HTTP 응답·협상",
    "slug": "set-cookie-parser",
    "title": "Set-Cookie 응답 헤더 분석기",
    "category": "document",
    "keywords": "Set-Cookie 한 줄의 이름·값·속성을 분석하세요. 브라우저 쿠키를 설치하거나 실제 만료 여부를 조회하지 않습니다.",
    "fields": {
      "source": "session=abc; Path=/; Secure; HttpOnly"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"name\": \"secure\""
  },
  {
    "group": "http-fields1000",
    "groupTitle": "HTTP 응답·협상",
    "slug": "cache-control-parser",
    "title": "Cache-Control 분석기",
    "category": "document",
    "keywords": "Cache-Control 헤더의 지시어와 값을 목록으로 분석하세요. 중복 지시어도 숨기지 않고 보여줍니다.",
    "fields": {
      "source": "public,max-age=3600"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"value\": \"3600\""
  },
  {
    "group": "http-fields1000",
    "groupTitle": "HTTP 응답·협상",
    "slug": "content-disposition-parser",
    "title": "Content-Disposition 분석기",
    "category": "document",
    "keywords": "Content-Disposition의 형식·파일 이름·매개변수를 분석하세요. UTF-8 filename*를 디코딩합니다.",
    "fields": {
      "source": "attachment; filename=\"report.pdf\""
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"filename\": \"report.pdf\""
  },
  {
    "group": "http-fields1000",
    "groupTitle": "HTTP 응답·협상",
    "slug": "link-header-parser",
    "title": "HTTP Link 헤더 분석기",
    "category": "document",
    "keywords": "HTTP Link 헤더의 대상 주소와 rel·매개변수를 분석하세요. 꺾쇠 안 쉼표와 따옴표 안 구분자를 보존합니다.",
    "fields": {
      "source": "<https://example.com/?a=1,2>; rel=\"next\""
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"rel\": \"next\""
  },
  {
    "group": "http-fields1000",
    "groupTitle": "HTTP 응답·협상",
    "slug": "http-basic-auth-converter",
    "title": "Basic 인증 문자열 변환기",
    "category": "document",
    "keywords": "사용자:비밀번호 글자와 Basic 인증 헤더를 UTF-8 기준으로 변환하세요. 실제 요청을 보내지 않습니다.",
    "fields": {
      "source": "Aladdin:open sesame"
    },
    "selects": {
      "mode": "encode"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ=="
  },
  {
    "group": "http-fields1000",
    "groupTitle": "HTTP 응답·협상",
    "slug": "etag-comparator",
    "title": "ETag 조건 비교기",
    "category": "document",
    "keywords": "두 ETag를 강한 비교 또는 약한 비교로 대조하세요. 실제 파일이나 서버 캐시를 조회하지 않습니다.",
    "fields": {
      "a": "\"abc\"",
      "b": "W/\"abc\""
    },
    "selects": {
      "mode": "weak"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "ETag가 일치합니다."
  },
  {
    "group": "network-address1000",
    "groupTitle": "주소·DNS 형식",
    "slug": "url-query-comparator",
    "title": "URL 쿼리 차이 비교기",
    "category": "document",
    "keywords": "두 URL의 쿼리 키·값 목록을 비교하세요. 중복 키와 값 순서를 유지해 바뀐 항목만 보여줍니다.",
    "fields": {
      "a": "https://example.com/?a=1",
      "b": "https://example.com/?a=2"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"key\": \"a\""
  },
  {
    "group": "network-address1000",
    "groupTitle": "주소·DNS 형식",
    "slug": "url-template-expander",
    "title": "URL 템플릿 확장기",
    "category": "document",
    "keywords": "간단한 RFC6570 URL 템플릿을 변수 객체로 확장하세요. {var}·{+var}·{?a,b}·{&a,b}와 단순 값만 지원합니다.",
    "fields": {
      "template": "https://example.com/{id}{?q}",
      "variables": "{\"id\":\"a b\",\"q\":\"x y\"}"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "https://example.com/a%20b?q=x%20y"
  },
  {
    "group": "network-address1000",
    "groupTitle": "주소·DNS 형식",
    "slug": "url-slug-generator",
    "title": "주소 슬러그 만들기",
    "category": "document",
    "keywords": "제목을 주소에 쓰기 좋은 소문자·하이픈 슬러그로 만드세요. 유니코드 유지 또는 ASCII 전용을 고릅니다.",
    "fields": {
      "source": "Hello, Café!"
    },
    "selects": {
      "mode": "ascii"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "hello-cafe"
  },
  {
    "group": "network-address1000",
    "groupTitle": "주소·DNS 형식",
    "slug": "dns-reverse-name-converter",
    "title": "역방향 DNS 이름 변환기",
    "category": "document",
    "keywords": "IPv4·IPv6 주소와 역방향 DNS 이름을 서로 변환하세요. 실제 DNS 서버에 조회하지 않습니다.",
    "fields": {
      "source": "192.0.2.1"
    },
    "selects": {
      "mode": "encode"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "1.2.0.192.in-addr.arpa."
  },
  {
    "group": "network-address1000",
    "groupTitle": "주소·DNS 형식",
    "slug": "eui64-converter",
    "title": "MAC EUI-64 변환기",
    "category": "document",
    "keywords": "48비트 MAC과 FF:FE 삽입 EUI-64를 서로 변환하세요. IPv6용 수정 EUI-64는 U/L 비트를 뒤집습니다.",
    "fields": {
      "source": "00:1a:2b:3c:4d:5e"
    },
    "selects": {
      "mode": "encode",
      "kind": "modified"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "02:1a:2b:ff:fe:3c:4d:5e"
  },
  {
    "group": "network-address1000",
    "groupTitle": "주소·DNS 형식",
    "slug": "cidr-subnet-splitter",
    "title": "CIDR 서브넷 나누기",
    "category": "document",
    "keywords": "IPv4·IPv6 CIDR을 더 긴 접두사의 같은 크기 서브넷으로 나누세요. 호스트 비트는 네트워크로 맞춥니다.",
    "fields": {
      "source": "192.168.1.0/24",
      "prefix": "26"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "192.168.1.192/26"
  },
  {
    "group": "network-address1000",
    "groupTitle": "주소·DNS 형식",
    "slug": "dns-record-zone-generator",
    "title": "DNS 레코드 문장 만들기",
    "category": "document",
    "keywords": "A·AAAA·CNAME·MX·TXT DNS 레코드 문장을 만드세요. 실제 DNS 설정을 변경하지 않습니다.",
    "fields": {
      "name": "www",
      "value": "192.0.2.1",
      "ttl": "3600",
      "priority": "10"
    },
    "selects": {
      "type": "A"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "www 3600 IN A 192.0.2.1"
  },
  {
    "group": "network-address1000",
    "groupTitle": "주소·DNS 형식",
    "slug": "email-address-validator",
    "title": "이메일 주소 형식 검사기",
    "category": "document",
    "keywords": "따옴표 없는 ASCII 계정과 DNS 도메인의 이메일 형식을 검사하세요. 국제화 도메인은 IDNA로 정리합니다.",
    "fields": {
      "source": "haru@example.com"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "형식 통과: haru@example.com"
  },
  {
    "group": "system-format1000",
    "groupTitle": "시스템 시간·경로",
    "slug": "http-date-converter",
    "title": "HTTP 날짜 변환기",
    "category": "document",
    "keywords": "IMF-fixdate HTTP 날짜와 ISO 시각을 서로 바꾸세요. HTTP 날짜는 GMT이며 잘못된 요일도 검사합니다.",
    "fields": {
      "source": "1994-11-06T08:49:37Z"
    },
    "selects": {
      "mode": "encode"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "Sun, 06 Nov 1994 08:49:37 GMT"
  },
  {
    "group": "system-format1000",
    "groupTitle": "시스템 시간·경로",
    "slug": "ntp-timestamp-converter",
    "title": "NTP 타임스탬프 변환기",
    "category": "document",
    "keywords": "NTP64비트 초:소수부와 ISO 시각을 변환하세요. 2036년 순환을 구분하는 era를 직접 지정합니다.",
    "fields": {
      "source": "1900-01-01T00:00:00Z",
      "era": "0"
    },
    "selects": {
      "mode": "encode"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "0:0"
  },
  {
    "group": "system-format1000",
    "groupTitle": "시스템 시간·경로",
    "slug": "windows-filetime-converter",
    "title": "Windows FILETIME 변환기",
    "category": "document",
    "keywords": "Windows FILETIME100ns 정수와 ISO 시각을 서로 바꾸세요. 1601년 UTC 기준이며 소수초7자리를 보존합니다.",
    "fields": {
      "source": "1970-01-01T00:00:00Z"
    },
    "selects": {
      "mode": "encode"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "116444736000000000"
  },
  {
    "group": "system-format1000",
    "groupTitle": "시스템 시간·경로",
    "slug": "excel-serial-date-converter",
    "title": "엑셀 일련 날짜 변환기",
    "category": "document",
    "keywords": "엑셀1900·1904 일련번호와 ISO 시각을 변환하세요. 실제로 없는1900-02-29의 일련번호60은 거부합니다.",
    "fields": {
      "source": "1970-01-01T00:00:00Z"
    },
    "selects": {
      "system": "1900",
      "mode": "encode"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "25569"
  },
  {
    "group": "system-format1000",
    "groupTitle": "시스템 시간·경로",
    "slug": "unix-permission-converter",
    "title": "chmod 권한 변환기",
    "category": "document",
    "keywords": "chmod8진 권한과 rwxrwxrwx 기호를 변환하세요. setuid·setgid·sticky 비트를 포함합니다.",
    "fields": {
      "source": "755"
    },
    "selects": {
      "mode": "symbol"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "rwxr-xr-x"
  },
  {
    "group": "system-format1000",
    "groupTitle": "시스템 시간·경로",
    "slug": "unix-umask-calculator",
    "title": "umask 권한 계산기",
    "category": "document",
    "keywords": "umask가 새 파일·디렉터리 권한에 주는 결과를 확인하세요. 실제 시스템의 권한은 바꾸지 않습니다.",
    "fields": {
      "source": "022"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "일반 파일: 644"
  },
  {
    "group": "system-format1000",
    "groupTitle": "시스템 시간·경로",
    "slug": "posix-path-normalizer",
    "title": "POSIX 경로 정리기",
    "category": "document",
    "keywords": "POSIX 경로의 .·..·중복 /를 글자 기준으로 정리하세요. 파일이나 심볼릭 링크는 조회하지 않습니다.",
    "fields": {
      "source": "/a/b/../c/./"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "/a/c/"
  },
  {
    "group": "system-format1000",
    "groupTitle": "시스템 시간·경로",
    "slug": "glob-pattern-tester",
    "title": "경로 glob 검사기",
    "category": "document",
    "keywords": "경로 목록을 *·?·** glob 패턴과 비교하세요. **/는0개 이상의 디렉터리이며 정규식을 실행하지 않습니다.",
    "fields": {
      "pattern": "**/*.js",
      "paths": "app.js\nsrc/main.js\nimage.png"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "일치\tapp.js"
  },
  {
    "group": "csv-reconcile1000",
    "groupTitle": "CSV 파일 대조·정리",
    "slug": "csv-full-outer-join",
    "title": "CSV 양쪽 전체 결합기",
    "category": "document",
    "keywords": "두 CSV를 키로 전체 결합하세요. 한쪽에만 있는 행도 남기고 비어 있는 쪽의 값은 빈칸으로 채웁니다.",
    "fields": {
      "source": "id,a\n1,x\n2,y",
      "right": "id,b\n2,z\n3,q",
      "leftKey": "id",
      "rightKey": "id"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "3,,q"
  },
  {
    "group": "csv-reconcile1000",
    "groupTitle": "CSV 파일 대조·정리",
    "slug": "csv-row-update-by-key",
    "title": "CSV 키 기준 행 갱신기",
    "category": "document",
    "keywords": "키가 같은 CSV 행의 지정 열을 새 값으로 갱신하세요. 없는 키의 행을 추가할지도 고릅니다.",
    "fields": {
      "source": "id,name,keep\n1,a,x\n2,b,y",
      "right": "id,name\n2,new\n3,c",
      "key": "id"
    },
    "selects": {
      "mode": "append"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "2,new,y"
  },
  {
    "group": "csv-reconcile1000",
    "groupTitle": "CSV 파일 대조·정리",
    "slug": "csv-dataset-diff",
    "title": "CSV 데이터 차이 비교기",
    "category": "document",
    "keywords": "두 CSV를 키로 대조해 추가·삭제·값 변경 행을 찾으세요. 열 순서가 달라도 같은 열 이름끼리 비교합니다.",
    "fields": {
      "source": "id,name\n1,a\n2,b",
      "right": "name,id\na,1\nc,3",
      "key": "id"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"status\": \"삭제\""
  },
  {
    "group": "csv-reconcile1000",
    "groupTitle": "CSV 파일 대조·정리",
    "slug": "csv-row-append",
    "title": "CSV 파일 행 합치기",
    "category": "document",
    "keywords": "같은 열 이름을 가진 두 CSV의 데이터 행을 이어 붙이세요. 둘째 표의 열 순서는 첫 표에 맞춥니다.",
    "fields": {
      "source": "a,b\n1,x",
      "right": "b,a\ny,2"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "2,y"
  },
  {
    "group": "csv-reconcile1000",
    "groupTitle": "CSV 파일 대조·정리",
    "slug": "csv-column-value-mapper",
    "title": "CSV 값 대응표 바꾸기",
    "category": "document",
    "keywords": "CSV 한 열의 코드를 대응표 값으로 바꾸세요. 대응하지 않는 값을 유지하거나 오류로 확인합니다.",
    "fields": {
      "source": "id,status\n1,A\n2,B",
      "column": "status",
      "mapping": "A,완료\nB,진행"
    },
    "selects": {
      "mode": "keep"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "1,완료"
  },
  {
    "group": "csv-reconcile1000",
    "groupTitle": "CSV 파일 대조·정리",
    "slug": "csv-header-normalizer",
    "title": "CSV 열 이름 일괄 정리",
    "category": "document",
    "keywords": "CSV 열 이름의 공백·전각 문자·대소문자를 한 번에 정리하세요. 정리 뒤 이름이 겹치면 중단합니다.",
    "fields": {
      "source": " First Name , SCORE\n하루,90"
    },
    "selects": {
      "mode": "snake"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "first_name,score"
  },
  {
    "group": "csv-reconcile1000",
    "groupTitle": "CSV 파일 대조·정리",
    "slug": "csv-drop-empty-rows-columns",
    "title": "CSV 빈 행·열 제거기",
    "category": "document",
    "keywords": "값이 모두 빈 CSV 데이터 행이나 열을 제거하세요. 열 이름은 빈 값 판정에서 제외합니다.",
    "fields": {
      "source": "a,b\n1,\n,\n2,"
    },
    "selects": {
      "scope": "both",
      "space": "empty"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "a\r\n1\r\n2"
  },
  {
    "group": "csv-reconcile1000",
    "groupTitle": "CSV 파일 대조·정리",
    "slug": "csv-cell-linebreak-cleaner",
    "title": "CSV 셀 줄바꿈 정리",
    "category": "document",
    "keywords": "따옴표로 감싼 CSV 셀 안의 줄바꿈을 지정한 글자로 바꾸세요. 데이터 행 구분은 그대로 유지합니다.",
    "fields": {
      "source": "id,note\n1,\"a\nb\"",
      "columns": "note",
      "replacement": " "
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "1,a b"
  },
  {
    "group": "http-requests1000",
    "groupTitle": "요청·설정·로그 작업",
    "slug": "dotenv-parser",
    "title": "환경변수 파일 JSON 변환기",
    "category": "document",
    "keywords": "단일행 .env 파일을 JSON 문자열 객체로 바꾸세요. 주석·export 접두사와 따옴표 값을 처리합니다.",
    "fields": {
      "source": "APP_NAME=\"하루콕\"\nPORT=3000"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"PORT\": \"3000\""
  },
  {
    "group": "http-requests1000",
    "groupTitle": "요청·설정·로그 작업",
    "slug": "dotenv-comparator",
    "title": "환경변수 키 차이 비교기",
    "category": "document",
    "keywords": "두 .env 파일의 추가·누락·변경 키를 확인하세요. 기본 출력은 값을 가려 설정 내용을 노출하지 않습니다.",
    "fields": {
      "a": "PORT=3000",
      "b": "PORT=4000"
    },
    "selects": {
      "values": "hide"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"status\": \"변경\""
  },
  {
    "group": "http-requests1000",
    "groupTitle": "요청·설정·로그 작업",
    "slug": "curl-request-generator",
    "title": "cURL 요청 명령 만들기",
    "category": "document",
    "keywords": "메서드·URL·헤더·본문으로 POSIX 셸용 cURL 명령을 만드세요. 요청은 실행하지 않습니다.",
    "fields": {
      "url": "https://example.com/api",
      "headers": "Content-Type: application/json",
      "body": "{\"a\":1}"
    },
    "selects": {
      "method": "POST"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "--data-raw '{\"a\":1}'"
  },
  {
    "group": "http-requests1000",
    "groupTitle": "요청·설정·로그 작업",
    "slug": "fetch-request-generator",
    "title": "JavaScript fetch 요청 만들기",
    "category": "document",
    "keywords": "JavaScript fetch 요청 코드를 만드세요. URL·헤더·본문은 문자열로 인용하고 실제 요청을 보내지 않습니다.",
    "fields": {
      "url": "https://example.com/api",
      "headers": "Content-Type: application/json",
      "body": "{\"a\":1}"
    },
    "selects": {
      "method": "POST",
      "response": "json"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "await response.json()"
  },
  {
    "group": "http-requests1000",
    "groupTitle": "요청·설정·로그 작업",
    "slug": "http-request-file-generator",
    "title": "HTTP 요청 파일 만들기",
    "category": "document",
    "keywords": "에디터 REST 클라이언트에 붙일 .http 요청 텍스트를 만드세요. 실제 요청·파일 저장은 하지 않습니다.",
    "fields": {
      "url": "https://example.com/api",
      "headers": "Accept: application/json",
      "body": ""
    },
    "selects": {
      "method": "GET"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "GET https://example.com/api HTTP/1.1"
  },
  {
    "group": "http-requests1000",
    "groupTitle": "요청·설정·로그 작업",
    "slug": "har-request-summary",
    "title": "HAR 네트워크 요청 요약",
    "category": "document",
    "keywords": "HAR JSON의 요청·응답 상태·소요시간·크기를 표로 정리하세요. 헤더·본문은 내보내지 않으며 흔한 비밀 쿼리 값은 가립니다.",
    "fields": {
      "source": "{\"log\":{\"entries\":[{\"request\":{\"method\":\"GET\",\"url\":\"https://example.com/api?token=abc\"},\"response\":{\"status\":200,\"content\":{\"size\":120}},\"time\":30}]}}"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": ",200,30,120"
  },
  {
    "group": "http-requests1000",
    "groupTitle": "요청·설정·로그 작업",
    "slug": "curl-to-http-request-converter",
    "title": "cURL을 HTTP 요청으로 변환",
    "category": "document",
    "keywords": "기본 POSIX cURL 명령을 .http 요청으로 바꾸세요. 인용 문자열을 읽으며 명령은 절대 실행하지 않습니다.",
    "fields": {
      "source": "curl -X POST 'https://example.com/api' -H 'Content-Type: application/json' --data-raw '{\"a\":1}'"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "POST https://example.com/api HTTP/1.1"
  },
  {
    "group": "http-requests1000",
    "groupTitle": "요청·설정·로그 작업",
    "slug": "access-log-status-summary",
    "title": "접속 로그 상태 코드 집계",
    "category": "document",
    "keywords": "Common·Combined 접속 로그의 HTTP 상태별 요청 수와 바이트를 집계하세요. 원본 IP·시각은 결과에 남기지 않습니다.",
    "fields": {
      "source": "127.0.0.1 - - [07/Nov/2026:12:00:00 +0900] \"GET / HTTP/1.1\" 200 123"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "200,1,123"
  },
  {
    "group": "encoding-code1000",
    "groupTitle": "인코딩·웹 진단",
    "slug": "url-list-domain-grouper",
    "title": "URL 목록 도메인별 묶기",
    "category": "document",
    "keywords": "URL 목록을 호스트 또는 출처별로 묶어 요청 수와 고유 URL 수를 집계하세요. 실제 사이트에 접속하지 않습니다.",
    "fields": {
      "source": "https://example.com/a\nhttps://example.com/b"
    },
    "selects": {
      "mode": "host"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "example.com,2,2"
  },
  {
    "group": "encoding-code1000",
    "groupTitle": "인코딩·웹 진단",
    "slug": "url-list-tracking-remover",
    "title": "URL 추적 매개변수 지우기",
    "category": "document",
    "keywords": "URL 목록에서 utm_·클릭 추적 매개변수를 지우세요. 추가로 제거할 키도 지정할 수 있습니다.",
    "fields": {
      "source": "https://example.com/?a=1&utm_source=x&fbclid=y",
      "keys": ""
    },
    "selects": {
      "hash": "keep"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "https://example.com/?a=1"
  },
  {
    "group": "encoding-code1000",
    "groupTitle": "인코딩·웹 진단",
    "slug": "robots-txt-auditor",
    "title": "robots.txt 문법 검사기",
    "category": "document",
    "keywords": "robots.txt의 그룹·경로·Sitemap 문법을 검사하세요. 실제 크롤러 접근 여부나 검색 색인은 조회하지 않습니다.",
    "fields": {
      "source": "User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "지원 문법에서 문제가 발견되지 않았습니다."
  },
  {
    "group": "encoding-code1000",
    "groupTitle": "인코딩·웹 진단",
    "slug": "sitemap-xml-auditor",
    "title": "사이트맵 XML 검사기",
    "category": "document",
    "keywords": "사이트맵 XML의 URL·중복·lastmod 날짜를 검사하세요. urlset·sitemapindex를 지원하며 실제 URL에는 접속하지 않습니다.",
    "fields": {
      "source": "<urlset><url><loc>https://example.com/</loc><lastmod>2026-11-07</lastmod></url></urlset>",
      "origin": "https://example.com"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "URL·중복·날짜 형식 검사 통과"
  },
  {
    "group": "checksum-auth1000",
    "groupTitle": "인증·설정 검사",
    "slug": "uuid-v5-generator",
    "title": "UUID v5 만들기",
    "category": "document",
    "keywords": "네임스페이스와 이름으로 같은 입력에 같은 UUID v5를 만드세요. RFC9562 SHA-1 이름 기반 규칙을 사용합니다.",
    "fields": {
      "namespace": "DNS",
      "source": "www.example.com"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "2ed6657d-e927-568b-95e1-2665a8aea6a2"
  },
  {
    "group": "checksum-auth1000",
    "groupTitle": "인증·설정 검사",
    "slug": "hmac-sha1-generator",
    "title": "HMAC-SHA1 인증코드 계산기",
    "category": "document",
    "keywords": "키와 글자로 HMAC-SHA1 인증코드를 계산하세요. HTTPS 브라우저의 기본 암호화 API를 사용합니다.",
    "fields": {
      "key": "0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b",
      "source": "Hi There"
    },
    "selects": {
      "format": "hex"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "b617318655057264e28bc0b6fb378c8ef146be00"
  },
  {
    "group": "checksum-auth1000",
    "groupTitle": "인증·설정 검사",
    "slug": "totp-generator",
    "title": "TOTP 일회용 코드 계산기",
    "category": "document",
    "keywords": "Base32 비밀키와 UNIX 초로 TOTP 코드를 계산하세요. SHA-1·6자리 또는8자리만 지원하며 자동 갱신하지 않습니다.",
    "fields": {
      "secret": "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
      "timestamp": "59",
      "period": "30"
    },
    "selects": {
      "digits": "8"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "코드: 94287082"
  },
  {
    "group": "checksum-auth1000",
    "groupTitle": "인증·설정 검사",
    "slug": "bech32-converter",
    "title": "Bech32 체크섬 변환기",
    "category": "document",
    "keywords": "바이트와 Bech32·Bech32m 체크섬 문자열을 변환하세요. 가상자산 주소 여부나 계정 소유자는 판단하지 않습니다.",
    "fields": {
      "source": "",
      "hrp": "a"
    },
    "selects": {
      "mode": "encode",
      "variant": "bech32"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "a12uel5l"
  },
  {
    "group": "checksum-auth1000",
    "groupTitle": "인증·설정 검사",
    "slug": "fletcher16-calculator",
    "title": "Fletcher-16 체크섬 계산기",
    "category": "document",
    "keywords": "16진 바이트의 Fletcher-16 체크섬을 계산하세요. 초기합0·mod255 방식이며 암호학적 인증은 아닙니다.",
    "fields": {
      "source": "61 62 63"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "16진수: 4c27"
  },
  {
    "group": "checksum-auth1000",
    "groupTitle": "인증·설정 검사",
    "slug": "package-json-dependency-list",
    "title": "package.json 의존성 목록 추출",
    "category": "document",
    "keywords": "package.json의 일반·개발·선택·피어 의존성을 한 CSV 목록으로 추출하세요. 버전 조회나 패키지 설치는 하지 않습니다.",
    "fields": {
      "source": "{\"dependencies\":{\"x\":\"^1.0.0\"}}"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "x,dependencies,^1.0.0"
  },
  {
    "group": "checksum-auth1000",
    "groupTitle": "인증·설정 검사",
    "slug": "git-conflict-marker-finder",
    "title": "Git 충돌 표시 찾기",
    "category": "document",
    "keywords": "글에서 Git 충돌 표시의 시작·기준·구분·끝 줄을 찾으세요. 원문을 바꾸거나 자동 병합하지 않습니다.",
    "fields": {
      "source": "<<<<<<< HEAD\na\n=======\nb\n>>>>>>> next"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "\"separator\": 3"
  },
  {
    "group": "log-fixtures1000",
    "groupTitle": "로그·테스트 자료",
    "slug": "log-level-counter",
    "title": "로그 레벨 집계기",
    "category": "document",
    "keywords": "로그의 TRACE·DEBUG·INFO·WARN·ERROR·FATAL 레벨을 집계하세요. 일반 텍스트 또는 JSONL level 필드를 고릅니다.",
    "fields": {
      "source": "INFO start\nERROR fail\nINFO done"
    },
    "selects": {
      "mode": "text"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "INFO,2"
  },
  {
    "group": "log-fixtures1000",
    "groupTitle": "로그·테스트 자료",
    "slug": "log-secret-redactor",
    "title": "로그 인증정보 가리기",
    "category": "document",
    "keywords": "로그의 Authorization·Cookie 헤더와 지정한 키 값을 가리세요. 흔한 표기만 처리하므로 공유 전 결과를 검토하세요.",
    "fields": {
      "source": "Authorization: Bearer demo\npassword=abc",
      "keys": "password,token"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "password=\"[가림]\""
  },
  {
    "group": "log-fixtures1000",
    "groupTitle": "로그·테스트 자료",
    "slug": "log-time-difference",
    "title": "로그 시각 간격 계산기",
    "category": "document",
    "keywords": "ISO 시각으로 시작하는 로그 행의 시간 간격을 계산하세요. 이전 행 또는 첫 행 기준으로 비교합니다.",
    "fields": {
      "source": "2026-11-07T00:00:00Z a\n2026-11-07T00:00:01.500Z b"
    },
    "selects": {
      "mode": "previous"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": ",1500"
  },
  {
    "group": "log-fixtures1000",
    "groupTitle": "로그·테스트 자료",
    "slug": "lorem-ipsum-generator",
    "title": "로렘 입숨 만들기",
    "category": "document",
    "keywords": "디자인 시안에 넣을 로렘 입숨 채움글을 만드세요. 단어 수와 문단 수를 정해 복사합니다.",
    "fields": {
      "words": "5",
      "paragraphs": "1"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "Lorem ipsum dolor sit amet."
  },
  {
    "group": "log-fixtures1000",
    "groupTitle": "로그·테스트 자료",
    "slug": "test-email-list-generator",
    "title": "테스트 이메일 목록 만들기",
    "category": "document",
    "keywords": "예약된 예시 도메인으로 테스트용 이메일 목록을 만드세요. 실제 메일을 보내거나 계정을 만들지 않습니다.",
    "fields": {
      "prefix": "test",
      "start": "1",
      "count": "2"
    },
    "selects": {
      "domain": "example.com"
    },
    "button": "실행하기",
    "output": "#result-text",
    "expected": "test2@example.com"
  },
  {
    "group": "log-fixtures1000",
    "groupTitle": "로그·테스트 자료",
    "slug": "json-fixture-generator",
    "title": "JSON 테스트 자료 만들기",
    "category": "document",
    "keywords": "필드 이름과 자료형으로 반복 가능한 JSON 테스트 자료를 만드세요. 이메일은 예약된 example.com만 사용합니다.",
    "fields": {
      "fields": "id,integer\nemail,email",
      "count": "2",
      "start": "1"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "test2@example.com"
  },
  {
    "group": "log-fixtures1000",
    "groupTitle": "로그·테스트 자료",
    "slug": "uuid-v7-generator",
    "title": "UUID v7 만들기",
    "category": "document",
    "keywords": "48비트 밀리초와 안전한 난수로 시간순 정렬용 UUID v7을 만드세요. 같은 밀리초 안 생성 순서는 보장하지 않습니다.",
    "fields": {
      "timestamp": "0",
      "count": "3"
    },
    "selects": {},
    "button": "실행하기",
    "output": "#result-text",
    "expected": "00000000-0000-7"
  }
];
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;},ok=x=>{assert.ok(x);checks++;},run=async(n,v)=>await require(path.join(root,'tools',n+'.js')).calculate(v),text=async(n,v)=>(await run(n,v)).text,bad=async(n,v)=>{await assert.rejects(()=>run(n,v),undefined,n+' '+JSON.stringify(v).slice(0,160));checks++;};
(async()=>{
 eq(samples.length,165);eq(new Set(samples.map(r=>r.slug)).size,165);
 for(const r of samples){const html=fs.readFileSync(path.join(root,'tools',r.slug+'.html'),'utf8'),js=fs.readFileSync(path.join(root,'tools',r.slug+'.js'),'utf8');eq((html.match(/ad-banner-isolated\.js/g)||[]).length,1);ok(html.includes('site-ui.css?v=20261108-1000'));ok(html.includes('20261107-1000'));ok(html.includes('https://harukok.com/tools/'+r.slug));ok(html.includes('application/ld+json'));ok(!/<button[^>]*>[^<]*(?:예시|샘플)/.test(html));ok(!/\beval\s*\(|new Function|\.innerHTML\s*=/.test(js));const result=await run(r.slug,{...r.fields,...r.selects});ok(result.text.replace(/\r\n/g,'\n').includes(r.expected.replace(/\r\n/g,'\n')));if(r.slug!=="dockerignore-generator")await bad(r.slug,{});}
// Exact CSV arithmetic, structural reconciliation and Unicode quoted cells.
eq(await text('csv-column-renamer',{source:'a,b\n1,2',mapping:'a,b\nb,a'}),'b,a\r\n1,2');
await bad('csv-column-renamer',{source:'a,b\n1,2',mapping:'a,b'});
eq(await text('csv-unpivot',{source:'id,a,b\nx,"one\ntwo",3',ids:'id',keyName:'key',valueName:'val'}),'id,key,val\r\nx,a,"one\ntwo"\r\nx,b,3');
eq(await text('csv-column-calculator',{source:'a,b\n1,3\n-1,8',left:'a',right:'b',name:'v',op:'divide'}),'a,b,v\r\n1,3,0.333333333333\r\n-1,8,-0.125');
await bad('csv-column-calculator',{source:'a,b\n1,0',left:'a',right:'b',name:'v',op:'divide'});
eq(await text('csv-running-total',{source:'v\n999999999999999999999999999999\n1',column:'v',name:'sum'}),'v,sum\r\n999999999999999999999999999999,999999999999999999999999999999\r\n1,1000000000000000000000000000000');
eq(await text('csv-row-append',{source:'id,v\n1,"a,b"',right:'v,id\nx,2'}),'id,v\r\n1,"a,b"\r\n2,x');
await bad('csv-row-append',{source:'a\nx',right:'b\ny'});
eq(await text('csv-row-update-by-key',{source:'id,a,b\n1,x,y',right:'id,a\n1,z\n2,q',key:'id',mode:'append'}),'id,a,b\r\n1,z,y\r\n2,q,');
await bad('csv-row-update-by-key',{source:'id,a\n1,x',right:'id,a\n1,z\n1,q',key:'id',mode:'append'});
eq(await text('csv-full-outer-join',{source:'id,a\n1,x\n2,y',right:'id,a\n2,z\n3,q',leftKey:'id',rightKey:'id'}),'id,a,비교_a_1\r\n1,x,\r\n2,y,z\r\n3,,q');
ok((await text('csv-dataset-diff',{source:'id,v\n1,01',right:'id,v\n1,1',key:'id'})).includes('"status": "변경"'));
eq(await text('csv-drop-empty-rows-columns',{source:'a,b,c\n1,,x\n,,\n2,,y',scope:'both',space:'empty'}),'a,c\r\n1,x\r\n2,y');
eq(await text('csv-cell-linebreak-cleaner',{source:'id,v\n1,"a\r\nb\rc\nd"',columns:'v',replacement:' / '}),'id,v\r\n1,a / b / c / d');
await bad('csv-header-normalizer',{source:'A, a\n1,2',mode:'lower'});
await bad('csv-column-value-mapper',{source:'k\nx',column:'k',mapping:'a,b',mode:'error'});
for(const r of samples.filter(r=>r.slug.startsWith('csv-')))for(const source of ['a,a\n1,2','a,b\n1','a,b\n"x,2','a,b\n"x"oops,2'])await bad(r.slug,{...r.fields,...r.selects,source});

// JSON keys use own properties; tiny numeric exponents remain usable in sums.
eq(JSON.parse(await text('json-prune-empty',{source:'{"a":[null,0,false,"",{},[]],"b":"  "}'})),{a:[0,false]});
eq(JSON.parse(await text('json-mask-fields',{source:'{"__proto__":{"token":"x"},"constructor":"v"}',keys:'token',mask:'***'})),JSON.parse('{"__proto__":{"token":"***"},"constructor":"v"}'));eq({}.token,undefined);
await bad('json-key-case-converter',{source:'{"a_b":1,"a-b":2}',mode:'camel'});
eq(JSON.parse(await text('json-array-set-operations',{a:'[{"b":2,"a":1},1,"1"]',b:'[{"a":1,"b":2},1]',mode:'intersection'})),[{b:2,a:1},1]);
await bad('json-array-to-object',{source:'[{"id":"a"},{"id":"a"}]',key:'id'});
eq(JSON.parse(await text('json-array-to-object',{source:'[{"id":"__proto__","v":1}]',key:'id'})),JSON.parse('{"__proto__":{"id":"__proto__","v":1}}'));
ok((await text('json-numeric-aggregator',{source:'[{"v":1e-8},{"v":2e-8}]',key:'v'})).includes('합계: 0.00000003'));
eq(await text('json-leaf-value-search',{source:'{"~a/b":[true,"true"]}',value:'true'}),'"/~0a~1b/0"');
for(const r of samples.filter(r=>r.slug.startsWith('json-')&&Object.hasOwn(r.fields,'source')))for(const source of ['{"x":1,"x":2}','{"x":9007199254740993}','{"x":1.00000000000000001}','{"x":1e999}','{"x":1e-999}'])await bad(r.slug,{...r.fields,...r.selects,source});

// XML1.0 grammar subset, mixed-content order, entity safety and source generation.
const xml='<a x="a&#10;b">before<b id="1"/>after<![CDATA[<&]]></a>';
eq(await text('xml-text-extractor',{source:xml}),'beforeafter<&');
const tree=JSON.parse(await text('xml-json-converter',{source:xml}));eq(tree.children,['before',{name:'b',attributes:{id:'1'},children:[]},'after<&']);eq(tree.attributes.x,'a\nb');
const serialized=await text('json-xml-builder',{source:JSON.stringify(tree),mode:'pretty'});eq(JSON.parse(await text('xml-json-converter',{source:serialized})),tree);
eq(await text('xml-formatter',{source:'<!----><?xml-stylesheet href="a.css"?><a/>',mode:'pretty'}),'<a/>');
eq(await text('xml-text-extractor',{source:'<?xml version="1.0"?><a>&#x1F600;&apos;&quot;</a>'}),'😀\'"');
for(const source of ['<a><b></a>','<a x="1" x="2"/>','<a>&unknown;</a>','<a>&amp</a>','<a/>x','<a/><b/>','<!DOCTYPE a><a/>','<a>&#0;</a>','<a>&#xD800;</a>','<a>]]></a>','<!--a--b--><a/>','<a x="<"/>','<a','<a>','<?XML version="1.0"?><a/>','<a/>&#32;','\u00a0<a/>','<a\u00a0x="1"/>','<?xml\u00a0version="1.0"?><a/>'])await bad('xml-formatter',{source,mode:'pretty'});
await bad('json-xml-builder',{source:'{"name":"a/><script","attributes":{},"children":[]}',mode:'pretty'});
await bad('xml-formatter',{source:'<a>'.repeat(42)+'</a>'.repeat(42),mode:'pretty'});

// Generated code never executes untrusted text, and syntax output escapes delimiters.
ok((await text('html-details-generator',{summary:'</summary><script>x</script>',source:'<&',open:'no'})).includes('&lt;script&gt;'));
await bad('html-form-generator',{fields:'x,이름,text\nx,이름,text',action:'https://example.com/',method:'post'});
await bad('html-download-link-generator',{url:'https://example.com/',filename:'../x',label:'x'});
for(const r of samples.filter(r=>r.slug.endsWith('jsonld-generator'))){const code=await text(r.slug,{...r.fields,...r.selects}),match=code.match(/^<script type="application\/ld\+json">\n([\s\S]*)\n<\/script>$/);ok(match);const parsed=JSON.parse(match[1]);eq(parsed['@context'],'https://schema.org');ok(!Object.hasOwn(parsed,'aggregateRating'));}
const injected=await text('organization-jsonld-generator',{name:'</script><img>',url:'https://example.com/',logo:''});ok(!injected.slice(0,-9).includes('</script>'));ok(injected.includes('\\u003c'));
await bad('event-jsonld-generator',{name:'x',url:'https://example.com/',start:'2026-02-30T10:00:00Z',end:'2026-03-01T10:00:00Z',place:'x',address:'y'});
await bad('cors-header-builder',{origin:'*',methods:'GET',headers:'',age:'10',credentials:'yes'});
await bad('cors-header-builder',{origin:'https://example.com/path',methods:'GET',headers:'',age:'10',credentials:'no'});
await bad('nginx-static-config-generator',{host:'a; bad',root:'/var/www',port:'80',mode:'files'});
for(let i=0;i<=100;i++){const p=i/100,r=await run('css-cubic-bezier-evaluator',{x1:'.2',y1:'.2',x2:'.8',y2:'.8',progress:String(p)});ok(Math.abs(r.data.y-p)<2e-14);}

// Markdown/text payloads and fenced-code exclusion.
eq(await text('markdown-table-to-csv',{source:'| a | b |\n| --- | :---: |\n| x\\|y | `a|b` |'}),'a,b\r\nx|y,`a|b`');
eq(await text('markdown-checklist-progress',{source:'- [x] a\n```\n- [x] hidden\n```\n- [ ] b'}),'완료: 1개\n미완료: 1개\n전체: 2개\n진행률: 50%');
ok(!(await text('markdown-heading-outline',{source:'```\n# hidden\n```\n## shown'})).includes('hidden'));
eq(await text('markdown-codeblock-extractor',{source:'````js\n```x```\n````'}),'[1] js\n```x```');
eq(await text('text-line-rotator',{source:'😀\na\nb',steps:'-1'}),'a\nb\n😀');
eq(await text('text-repeated-block-remover',{source:'a\nb\na\nb\na\nb\nc',size:'2'}),'a\nb\nc');
eq(await text('text-line-unwrapper',{source:'a\r\nb\r\n\r\nc'}),'a b\n\nc');

// RFC9285 vectors, Ascii85 and IDNA round trips.
for(const[a,b]of [['AB','BB8'],['Hello!!','%69 VD92EX0'],['base-45','UJCLQE7W581'],['ietf!','QED8WEX0']]){eq(await text('base45-converter',{source:a,mode:'encode'}),b);eq(await text('base45-converter',{source:b,mode:'decode'}),a);}
for(const s of ['A',':::','0000','\nBB8'])await bad('base45-converter',{source:s,mode:'decode'});
eq(await text('ascii85-converter',{source:'<~87cURDZ~>',mode:'decode'}),'Hello');
for(const s of ['a','하루콕','😀 x','\0\0\0\0','a\0b','ééé',...Array.from({length:70},(_,i)=>'x'.repeat(i+1))]){const coded=await text('ascii85-converter',{source:s,mode:'encode'});eq(await text('ascii85-converter',{source:coded,mode:'decode'}),s);const b45=await text('base45-converter',{source:s,mode:'encode'});eq(await text('base45-converter',{source:b45,mode:'decode'}),s);}
for(const s of ['<~!~>','<~zz!z~>','<~uuuuu~>','<~abc','~>'])await bad('ascii85-converter',{source:s,mode:'decode'});
for(const n of [0n,1n,61n,62n,3843n,2n**128n-1n,10n**90n]){const coded=await text('base62-integer-converter',{source:n.toString(),mode:'encode'});eq(await text('base62-integer-converter',{source:coded,mode:'decode'}),n.toString());}
const {domainToUnicode}=require('node:url');for(const host of ['bücher.example','하루콕.example','例え.テスト','مثال.إختبار','café.example','mañana.example']){const ascii=await text('punycode-converter',{source:host,mode:'encode'});eq(ascii,new URL('https://'+host).hostname);eq(await text('punycode-converter',{source:ascii,mode:'decode'}),domainToUnicode(ascii));}

// Binary boundaries, canonical varints, signed widths, ProtoBuf known vector.
for(let n=-1000;n<=1000;n+=17){const bytes=await text('varint-converter',{source:String(n),mode:'encode',signed:'zigzag'});eq(await text('varint-converter',{source:bytes,mode:'decode',signed:'zigzag'}),String(n));}
eq(await text('varint-converter',{source:'18446744073709551615',mode:'encode',signed:'unsigned'}),'ff ff ff ff ff ff ff ff ff 01');
for(const s of ['80 00','80','ff ff ff ff ff ff ff ff ff 02','00 00'])await bad('varint-converter',{source:s,mode:'decode',signed:'unsigned'});
for(const width of [1,2,4,8])for(const signed of ['yes','no'])for(const endian of ['little','big']){const bits=BigInt(width*8),values=signed==='yes'?[-(1n<<(bits-1n)),-1n,0n,(1n<<(bits-1n))-1n]:[0n,1n,(1n<<bits)-1n];for(const n of values){const bytes=await text('integer-byte-array-converter',{source:n.toString(),mode:'encode',signed,endian,width:String(width)});eq(await text('integer-byte-array-converter',{source:bytes,mode:'decode',signed,endian,width:String(width)}),n.toString());}}
for(let n=0;n<1024;n++){const s=n.toString(2).padStart(12,'0'),gray=await text('gray-code-converter',{source:s,mode:'encode'});eq(await text('gray-code-converter',{source:gray,mode:'decode'}),s);}
eq(await text('bcd-converter',{source:await text('bcd-converter',{source:'001239',mode:'encode'}),mode:'decode'}),'001239');await bad('bcd-converter',{source:'1010',mode:'decode'});
eq(JSON.parse(await text('protobuf-wire-inspector',{source:'08 96 01 12 03 66 6f 6f'})).map(x=>[x.field,x.wire,x.value]),[['1',0,'150'],['2',2,'66 6f 6f']]);
for(const source of ['00','08 80','12 05 01','0b','0d 00'])await bad('protobuf-wire-inspector',{source});

// Header grammar and privacy-safe extraction.
ok((await text('accept-header-parser',{source:'text/html;foo="a,b";q=0.4,application/json;q=1'})).indexOf('application/json')<(await text('accept-header-parser',{source:'text/html;q=0.4,application/json;q=1'})).indexOf('text/html'));
for(const source of ['text/html;q=1.1','text/html;q=0.0001','*/json','text/html;q=0.5;q=0.2','text/html\r\nInjected: x'])await bad('accept-header-parser',{source});
eq(JSON.parse(await text('content-disposition-parser',{source:"attachment; filename*=UTF-8''%ED%95%98%EB%A3%A8.pdf"})).filename,'하루.pdf');
eq(JSON.parse(await text('link-header-parser',{source:'<https://example.com/?x=a,b>; rel="next", </page2>; rel="last"'})).length,2);
ok((await text('set-cookie-parser',{source:'a="b";\tSecure;\tHttpOnly'})).includes('"name": "secure"'));
eq(await text('etag-comparator',{a:'"x"',b:'W/"x"',mode:'strong'}),'ETag가 다릅니다.');eq(await text('etag-comparator',{a:'"x"',b:'W/"x"',mode:'weak'}),'ETag가 일치합니다.');
const basic=await text('http-basic-auth-converter',{source:'하루:비밀:문자',mode:'encode'});eq(await text('http-basic-auth-converter',{source:basic,mode:'decode'}),'사용자: 하루\n비밀번호: 비밀:문자');
await bad('http-basic-auth-converter',{source:'Basic %%%=',mode:'decode'});

// IP/CIDR/DNS and path calculations are offline.
for(const source of ['192.0.2.1','0.0.0.0','255.255.255.255','::','::1','2001:db8::abcd']){const reverse=await text('dns-reverse-name-converter',{source,mode:'encode'});eq(await text('dns-reverse-name-converter',{source:reverse,mode:'decode'}),source);}
eq(await text('cidr-subnet-splitter',{source:'10.1.2.129/24',prefix:'26'}),'10.1.2.0/26\n10.1.2.64/26\n10.1.2.128/26\n10.1.2.192/26');
eq(await text('cidr-subnet-splitter',{source:'2001:db8::ffff/126',prefix:'128'}),'2001:db8::fffc/128\n2001:db8::fffd/128\n2001:db8::fffe/128\n2001:db8::ffff/128');
await bad('cidr-subnet-splitter',{source:'0.0.0.0/0',prefix:'32'});
for(const kind of ['modified','standard']){const x=await text('eui64-converter',{source:'00:1a:2b:3c:4d:5e',mode:'encode',kind});eq(await text('eui64-converter',{source:x,mode:'decode',kind}),'00:1a:2b:3c:4d:5e');}
await bad('dns-record-zone-generator',{name:'a; bad',type:'A',value:'192.0.2.1',ttl:'1',priority:'0'});
for(const source of ['a..b@example.com','a@b@c.com','"a"@example.com','a@example..com'])await bad('email-address-validator',{source});
for(const [pattern,path,match]of [['**/*.js','app.js',true],['**/*.js','src/app.js',true],['*.js','src/app.js',false],['a/**/b','a/b',true],['a/**/b','a/x/y/b',true],['a/?','a/😀',true],['a/*','a/x/y',false],['a/**','a/x/y',true]])eq((await text('glob-pattern-tester',{pattern,paths:path})).startsWith('일치\t'),match);
for(const source of ['/a/b/../c','a/../../b','../../x','/../../x','a//b/'])eq(await text('posix-path-normalizer',{source}),require('node:path').posix.normalize(source));
for(let n=0;n<4096;n++){const octal=n.toString(8).padStart(4,'0'),symbol=await text('unix-permission-converter',{source:octal,mode:'symbol'});eq(await text('unix-permission-converter',{source:symbol,mode:'octal'}),octal);}

// Epoch standards, fictitious Excel serial60,100ns FILETIME and era rollover.
eq(await text('http-date-converter',{source:'Sun, 06 Nov 1994 08:49:37 GMT',mode:'decode'}),'1994-11-06T08:49:37.000Z');await bad('http-date-converter',{source:'Mon, 06 Nov 1994 08:49:37 GMT',mode:'decode'});
eq(await text('ntp-timestamp-converter',{source:'0:0',era:'1',mode:'decode'}),'2036-02-07T06:28:16.000Z');
for(const ms of [0,1,2,123,999]){const iso='2026-01-01T00:00:00.'+String(ms).padStart(3,'0')+'Z',n=await text('ntp-timestamp-converter',{source:iso,era:'0',mode:'encode'});eq(await text('ntp-timestamp-converter',{source:n,era:'0',mode:'decode'}),iso);}
for(const n of [0n,1n,1234567n,116444736000000001n,133000000001234567n]){const iso=await text('windows-filetime-converter',{source:n.toString(),mode:'decode'});eq(await text('windows-filetime-converter',{source:iso,mode:'encode'}),n.toString());}
for(const [n,iso]of [['1','1900-01-01T00:00:00.000Z'],['59','1900-02-28T00:00:00.000Z'],['61','1900-03-01T00:00:00.000Z'],['25569','1970-01-01T00:00:00.000Z']])eq(await text('excel-serial-date-converter',{source:n,system:'1900',mode:'decode'}),iso);
await bad('excel-serial-date-converter',{source:'60.5',system:'1900',mode:'decode'});
for(const system of ['1900','1904'])for(const iso of ['2026-01-01T00:00:00.001Z','2026-01-01T23:59:59.999Z','2024-02-29T12:34:56.123Z']){const serial=await text('excel-serial-date-converter',{source:iso,system,mode:'encode'});eq(await text('excel-serial-date-converter',{source:serial,system,mode:'decode'}),iso);}

// Real config/request workflows never execute the parsed/generated request.
eq(JSON.parse(await text('dotenv-parser',{source:'export A="x\\ny" # c\nB=12#c\nC=\'a#b\''})),{A:'x\ny',B:'12',C:'a#b'});
await bad('dotenv-parser',{source:'A=1\nA=2'});eq({}.polluted,undefined);
const secret=await text('dotenv-comparator',{a:'TOKEN=one',b:'TOKEN=two',values:'hide'});ok(!secret.includes('one')&&!secret.includes('two'));
const request={method:'POST',url:'https://example.com/api',headers:'X-Name: 하루\nContent-Type: text/plain',body:"a'b\nc"},curl=await text('curl-request-generator',request);eq(await text('curl-to-http-request-converter',{source:curl}),await text('http-request-file-generator',request));
await bad('curl-to-http-request-converter',{source:'curl https://example.com/; touch x'});await bad('curl-to-http-request-converter',{source:'curl -d @file https://example.com/'});await bad('curl-to-http-request-converter',{source:'curl "$URL"'});
await bad('fetch-request-generator',{...request,method:'GET',response:'text'});
const redacted=await text('log-secret-redactor',{source:'Authorization: Bearer ABC\npassword=DEF\n{"token":"GHI"}',keys:'password,token'});ok(!redacted.includes('ABC')&&!redacted.includes('DEF')&&!redacted.includes('GHI'));
eq(await text('url-list-tracking-remover',{source:'https://example.com/?a=1&a=2&utm_source=x&fbclid=y#top',keys:'',hash:'keep'}),'https://example.com/?a=1&a=2#top');
ok((await text('sitemap-xml-auditor',{source:'<urlset><url><loc>https://example.com/</loc></url><url><loc>https://example.com/</loc><lastmod>2026-02-30</lastmod></url></urlset>',origin:'https://example.com'})).includes('중복 URL'));

// RFC6238, RFC2202, RFC9562 and BIP173/350 known answers; OpenSSL HMAC crosschecks.
const totpSecret='GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';for(const[t,code]of [['59','94287082'],['1111111109','07081804'],['1111111111','14050471'],['1234567890','89005924'],['2000000000','69279037'],['20000000000','65353130']])eq((await run('totp-generator',{secret:totpSecret,timestamp:t,period:'30',digits:'8'})).value,code);
eq(await text('hmac-sha1-generator',{key:'Jefe',format:'utf8',source:'what do ya want for nothing?'}),'effcdf6ae5eb2fa2d27416d5f184df9c259a7c79');
for(let n=1;n<=80;n++){const key=Buffer.from(Array.from({length:n},(_,i)=>(i*17+n)%256)),source='message '+n+' 하루콕';eq(await text('hmac-sha1-generator',{key:key.toString('hex'),format:'hex',source}),crypto.createHmac('sha1',key).update(source).digest('hex'));}
eq(await text('uuid-v5-generator',{namespace:'DNS',source:'www.widgets.com'}),'21f7f8de-8051-5b89-8680-0195ef798b6a');
eq(await text('bech32-converter',{source:'',hrp:'a',mode:'encode',variant:'bech32'}),'a12uel5l');eq(await text('bech32-converter',{source:'',hrp:'a',mode:'encode',variant:'bech32m'}),'a1lqfn3a');
for(const variant of ['bech32','bech32m'])for(let n=0;n<30;n++){const bytes=Array.from({length:n},(_,i)=>(i*13+n)%256).map(x=>x.toString(16).padStart(2,'0')).join(' '),code=await text('bech32-converter',{source:bytes,hrp:'data',mode:'encode',variant}),out=await text('bech32-converter',{source:code,hrp:'',mode:'decode',variant});ok(out.endsWith('바이트: '+bytes));await bad('bech32-converter',{source:code.slice(0,-1)+(code.at(-1)==='q'?'p':'q'),hrp:'',mode:'decode',variant});}
for(const [source,expected]of [['61 62 63 64 65','c8f0'],['61 62 63 64 65 66','2057'],['31 32 33 34 35 36 37 38 39','1ede']])ok((await text('fletcher16-calculator',{source})).includes(expected));
const ids=(await text('uuid-v7-generator',{timestamp:'0',count:'100'})).split('\n');eq(new Set(ids).size,100);ok(ids.every(s=>/^00000000-0000-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(s)));

// Generated fetch code preserves unusual valid header names without prototype setters.
const snippet=await text('fetch-request-generator',{method:'POST',url:'https://example.com/',headers:'__proto__: literal\nX-Test: abc',body:"' ); globalThis.executed = true; //",response:'text'});let observed=null;await vm.runInNewContext('(async()=>{'+snippet+'})()',{Headers,console:{log(){}},fetch:async(url,options)=>{observed={url,options};return{ok:true,status:200,text:async()=>'ok'};}});eq(observed.options.headers.get('__proto__'),'literal');eq(observed.options.body,"' ); globalThis.executed = true; //");
for(const slug of ['totp-generator','hmac-sha1-generator'])ok(/type="password"/.test(fs.readFileSync(path.join(root,'tools',slug+'.html'),'utf8')));
await bad('css-border-generator',{width:'2',style:'solid',color:'red; color:blue',side:'all'});await bad('css-cubic-bezier-evaluator',{x1:'2',y1:'0',x2:'1',y2:'1',progress:'.5'});await bad('css-clip-path-polygon-generator',{points:'0 0\n100 100\n200 0'});
// Async native-crypto results must never revive stale UI after an input change.
function mockUI(){const elements=new Map();function element(id){if(!elements.has(id))elements.set(id,{value:'',textContent:'',hidden:id==='result',handlers:{},addEventListener(name,fn){this.handlers[name]=fn;},scrollIntoView(){},focus(){},select(){}});return elements.get(id);}const pending=[],context={module:{exports:{}},document:{getElementById:element},navigator:{clipboard:{writeText:async()=>{}}},TextEncoder,TextDecoder,Uint8Array,URL,crypto:{subtle:{digest:()=>new Promise((resolve,reject)=>pending.push({resolve,reject}))}}};vm.runInNewContext(fs.readFileSync(path.join(root,'tools/uuid-v5-generator.js'),'utf8'),context);return{element,pending};}
const ui=mockUI();ui.element('namespace').value='DNS';ui.element('source').value='first';const first=ui.element('calculator').handlers.submit({preventDefault(){}});ui.element('calculator').handlers.input();ui.pending[0].resolve(new Uint8Array(20).fill(1).buffer);await first;eq(ui.element('result').hidden,true);eq(ui.element('result-text').value,'');
const second=ui.element('calculator').handlers.submit({preventDefault(){}});ui.element('calculator').handlers.input();ui.pending[1].reject(new Error('late failure'));await second;eq(ui.element('error').textContent,'');
console.log('PASS - '+checks+' dev1000 checks:165 practical tools, RFC vectors, exact CSV/JSON, XML, encoding, permissions, epochs, request safety and async stale-result guards');
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
