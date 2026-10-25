# 사장님을 위한 SCAMPER 매트릭스 튜토리얼

동네 카페 사장님의 이야기로 배우는 소상공인용 SCAMPER 활용 가이드.
화면은 [씽킹 매트릭스](https://devlog.moonlang.com/scamper-matrix/)를 직접 조작해 캡처했습니다. 빌드 과정 없는 순수 정적 사이트입니다.

## 폴더 구조

```
index.html              튜토리얼 본문 (업종 탭은 data/businesses.js로 자동 생성)
data/businesses.js      ★ 업종 예시 데이터 — 새 업종은 여기에만 추가
data/json/<id>.json     씽킹 매트릭스 「JSON 입출력」에 바로 불러올 수 있는 파일 (자동 생성)
img/                    캡처 PNG / GIF (shop-<id>.png는 자동 생성)
tools/capture-shops.mjs 업종 보드 캡처 + JSON 생성 스크립트
```

## 로컬 미리보기

```bash
python3 -m http.server 8000   # 이 폴더에서 실행 → http://localhost:8000
```

## 새 업종 추가하기 (3단계)

1. `data/businesses.js` 배열 끝에 항목을 추가합니다.

   ```js
   {
     id: "bakery", group: "food", emoji: "🥐", label: "빵집", shop: "구움과자방", goal: "오후 매출 올리기",
     ideas: [
       // [렌즈, 제목, 설명, 효과(1~5), 실현성(1~5)]
       ["s", "현장 판매 대신 예약 픽업", "폐기 줄이기", 4, 5],
       ["c", "빵 + 커피 구독", "아침 고정 고객", 5, 4]
       // 렌즈 키: s 대체 · c 결합 · a 응용 · m 수정·확대 · p 전용 · e 제거·축소 · r 역전·재배열
     ],
     picks: [ // 보드 아래에 보이는 핵심 3줄
       ["S 대체", "예약 픽업 → 폐기 ↓"]
     ]
   }
   ```

   - `id`는 영문 소문자(파일명으로 쓰임), 같은 렌즈를 7개 모두 채우면 사이트에서 "7/7 완주"가 뜹니다.
   - `group`은 카테고리 칩(`window.BUSINESS_GROUPS`의 id: `food` 먹거리 · `care` 뷰티·건강 · `shop` 소매·생활 · `edu` 교육·돌봄)입니다. 생략하거나 없는 id를 쓰면 자동으로 "기타" 칩에 모입니다. 새 카테고리는 `BUSINESS_GROUPS`에 `{ id, emoji, label }`을 추가하면 됩니다.
2. 보드 이미지와 JSON을 생성합니다. (ego-browser 필요)

   ```bash
   # tools/capture-shops.mjs 의 ROOT 경로(절대경로)를 내 폴더로 고치고, 새 항목만 찍으려면 ONLY = ["bakery"]
   ego-browser nodejs < tools/capture-shops.mjs
   ```

   ego-browser가 없으면 `data/json/<id>.json`을 만들어 사이트의 ⇄ JSON 입출력에 붙여넣고 직접 스크린샷을 `img/shop-<id>.png`로 저장해도 됩니다.
3. 브라우저를 새로고침하면 탭이 자동으로 생깁니다. (`index.html#biz-bakery` 로 특정 업종 링크 가능)

> 이름·점수는 설명용 가상 예시임을 유지해주세요. 실제 가게의 이름·성과를 쓰면 안 됩니다.

## GitHub Pages로 공개

```bash
cd scamper-tutorial
git init -b main            # (이미 되어 있으면 생략)
git add . && git commit -m "feat: SCAMPER tutorial"
gh repo create scamper-tutorial --public --source=. --push
# 저장소 Settings → Pages → Source: Deploy from a branch → main / (root)
```

잠시 후 `https://<계정>.github.io/scamper-tutorial/` 에서 열립니다.
모든 경로가 상대경로라 하위 주소(프로젝트 페이지)에서도 그대로 동작하며, `.nojekyll`이 들어 있어 별도 설정이 필요 없습니다.
