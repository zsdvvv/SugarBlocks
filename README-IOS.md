# 🍎 아이폰 앱 만들기 (차근차근)

## 방법 A. 2분 설치 - PWA 앱 (추천!)
1) 서버 실행 또는 호스팅 주소 준비 (README.md)
2) 아이폰 **사파리**에서 `http://컴퓨터IP:8765` (호스팅이면 `https://주소`) 접속
3) 하단 **공유 버튼(⬆️) → "홈 화면에 추가"** 터치
4) 홈 화면 ⭐아이콘 → 전체화면 앱 실행! (컴퓨터·안드로이드와 크로스플레이 OK)

## 방법 B. 진짜 iOS 앱 (Xcode)
필요한 것: **맥(Mac) 컴퓨터** + Xcode(무료, App Store에서 설치)
1) 안드로이드 가이드(README-ANDROID.md)의 2~3단계를 그대로 진행 (같은 프로젝트 재사용 가능)
2) 이어서:
   ```
   npm install @capacitor/ios
   npx cap add ios
   npx cap open ios
   ```
3) Xcode가 열리면: 왼쪽 프로젝트 클릭 → **Signing & Capabilities** → Team에 본인 Apple ID 선택
4) 위쪽 기기 선택에서 케이블로 연결한 내 아이폰 선택 → ▶ 실행 버튼 → 폰에 앱 설치!
   (무료 Apple ID는 7일마다 재설치 필요)
5) 앱스토어 출시: Apple Developer Program 가입(연 $99) 후 App Store Connect에 업로드
- ⚠️ ws:// 접속은 iOS가 막을 수 있어요 → 무료 호스팅의 `wss://` 주소 사용을 추천
