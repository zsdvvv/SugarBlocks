# 🤖 안드로이드 앱 출시 - 따라만 하기 (프로세스별)

> 출시 버전 잠금: 이 패키지의 index.html은 기본이 💥블록버스터이고,
> 첫 화면 입력칸에 "TETRIS"를 정확히 입력해야만 🧱테트리스 모드가 열립니다.
> (개발 토글로 되돌리기: index.html에서 `RELEASE_BUILD = true` → `false`)

## 비용 정리 (가급적 무료)
| 경로 | 비용 |
|---|---|
| APK 직접 배포(카톡/itch.io/개인 사이트) | **0원** |
| PWA 설치(README-ANDROID.md 방법A) | **0원** |
| 구글 플레이 스토어 | 가입비 **$25 (1회, 평생)** — 이것만은 구글 정책상 무료 불가 |

---
## 프로세스 1. 개발 도구 설치  ⏱ 20분
1) Node.js LTS: https://nodejs.org → 설치 → **체크**: 명령창에 `node -v` 입력 → `v20.x` 등 버전이 나오면 OK
2) Android Studio: https://developer.android.com/studio → 설치 → 첫 실행에서 "Standard" 선택(SDK 자동 설치)
   → **체크**: More Actions → SDK Manager 에 "Android SDK Platform" 하나 이상 설치됨
- ❗오류 "SDK 라이선스": 명령창에서 `sdkmanager --licenses` 실행 후 전부 y

## 프로세스 2. 앱 프로젝트 만들기  ⏱ 5분
명령창(터미널)에서 한 줄씩:
```
mkdir sugarblocks-app && cd sugarblocks-app
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Sugar Blocks(슈가블럭스)" com.mygame.sugarblocks --web-dir=www
mkdir www
```
**체크**: `npx cap doctor` 실행 → 빨간 오류 없이 항목들이 ✔ 이면 OK

## 프로세스 3. 게임 넣기  ⏱ 2분
이 패키지의 5개 파일을 **www 폴더에 복사**:
`index.html, manifest.json, sw.js, icon-192.png, icon-512.png`
그리고:
```
npx cap add android
npx cap sync
```
**체크**: android 폴더가 생기고 sync가 "✔ copy / ✔ update" 로 끝나면 OK
- ❗오류 "JAVA_HOME": Android Studio 설치 후 재부팅. 그래도 안 되면
  환경변수 JAVA_HOME = `C:\Program Files\Android\Android Studio\jbr`

## 프로세스 4. 온라인 대전 허용 설정  ⏱ 2분
`android/app/src/main/AndroidManifest.xml` 열기 → `<application` 안에 추가:
```
android:usesCleartextTraffic="true"
```
(무료 호스팅의 `wss://`만 쓸 거면 생략 가능. 집 서버 `ws://IP`를 쓰려면 필수)

## 프로세스 5. 폰에서 테스트  ⏱ 10분
```
npx cap open android
```
1) 폰: 설정→휴대전화 정보→"빌드번호" 7번 연타(개발자모드)→ 개발자옵션→"USB 디버깅" 켜기 → USB 연결
2) Android Studio 상단 기기목록에 내 폰 선택 → ▶ 실행
**체크리스트**: 게임 화면 나옴 / 기본이 블록버스터 / "TETRIS" 입력 시 해금 /
로비에 서버 주소 입력하면 컴퓨터 브라우저와 실제 대전됨(크로스플레이)
- ❗흰 화면: www에 파일 5개 다 있는지 확인 후 `npx cap sync` 다시
- ❗온라인 안 됨: 프로세스4 확인, 폰과 서버가 같은 와이파이인지 확인

## 프로세스 6. 서명 키 만들기 (출시 필수, 1회)  ⏱ 5분
Android Studio: **Build → Generate Signed Bundle/APK → Android App Bundle → Next**
→ "Create new..." → 저장 위치/비밀번호/이름 입력 → OK
⚠️ 이 keystore 파일과 비밀번호를 잃으면 앱 업데이트가 영원히 불가능! 2곳 이상 백업!

## 프로세스 7. 출시 파일(AAB) 빌드  ⏱ 5분
같은 창에서 방금 만든 키 선택 → release 체크 → Finish
**체크**: `android/app/release/app-release.aab` 생성됨

## 프로세스 8. 구글 플레이 등록  ⏱ 1~2시간 + 심사 수일
1) https://play.google.com/console → 개발자 계정 만들기($25, 신분증 확인 1~2일)
2) "앱 만들기" → 이름 "Sugar Blocks(슈가블럭스)", 무료, 게임
3) 좌측 "스토어 등록정보": 짧은설명/자세한설명, 아이콘 512px(icon-512.png 그대로 사용 가능),
   스크린샷 2장 이상(폰에서 캡처), 그래픽 이미지 1024×500 1장
4) "앱 콘텐츠": 개인정보처리방침 URL(무료: 깃허브 페이지나 구글 사이트도구로 한 장 작성),
   데이터 보안 설문 → "수집 안 함"(이 게임은 서버에 이름/승수만 잠시 전달, 광고·계정 없음),
   콘텐츠 등급 설문 → 전체이용가
5) "테스트 → 내부 테스트"에 AAB 업로드 → 본인 폰으로 확인 → 문제 없으면
6) "프로덕션 → 새 버전 만들기" → 같은 AAB → **검토 후 출시** → 심사(보통 1~7일) 통과 시 전세계 공개!
- ❗흔한 반려: 스크린샷 부족, 개인정보처리방침 링크 없음, 데이터 보안 설문 불일치
