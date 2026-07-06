# 📱 안드로이드 앱 만들기 (차근차근)

## 방법 A. 5분 설치 - PWA 앱 (추천! 코딩 0줄)
서버만 켜져 있으면 진짜 앱처럼 설치됩니다. 크로스플레이 당연히 가능!
1) 컴퓨터에서 서버 실행 (README.md 참고) 또는 무료 호스팅 주소 준비
2) 안드로이드 **크롬**에서 `http://컴퓨터IP:8765` (호스팅이면 `https://주소`) 접속
3) 오른쪽 위 **⋮ 메뉴 → "앱 설치"** (또는 "홈 화면에 추가") 터치
4) 홈 화면에 ⭐아이콘 생성 → 터치하면 전체화면 앱으로 실행!
   - 오프라인에서도 혼자하기/컴퓨터 대전 가능 (서비스워커가 저장해 둠)
   - 온라인 대전은 로비에서 서버 주소가 자동으로 잡힘

## 방법 B. 진짜 APK 파일 만들기 (플레이스토어 배포용)
필요한 것: Node.js, Android Studio (둘 다 무료)
1) Android Studio 설치: https://developer.android.com/studio → 설치 후 한 번 실행(SDK 자동 설치)
2) 명령 프롬프트(터미널)에서 아래를 **한 줄씩** 복사-붙여넣기:
   ```
   mkdir sugarblocks-app
   cd sugarblocks-app
   npm init -y
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init "Sugar Blocks(슈가블럭스)" com.mygame.sugarblocks --web-dir=www
   mkdir www
   ```
3) 이 패키지의 `index.html`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png` 를 **www 폴더에 복사**
4) 계속 입력:
   ```
   npx cap add android
   npx cap open android
   ```
5) Android Studio가 열리면: 위 메뉴 **Build → Build App Bundle(s)/APK(s) → Build APK(s)**
   → 완료 알림의 "locate" 클릭 → `app-debug.apk` 가 내 앱!
6) ⚠️ 온라인 대전용 설정 1가지: `android/app/src/main/AndroidManifest.xml` 파일을 열어
   `<application` 태그 안에 `android:usesCleartextTraffic="true"` 를 추가
   (ws:// 주소 접속 허용. wss:// 호스팅만 쓰면 생략 가능)
7) APK를 폰에 복사해 설치 → 로비에 서버 주소 입력 → 컴퓨터·다른 폰과 대전!
- 플레이스토어 출시: Google Play Console 가입(1회 $25) 후 AAB 업로드
