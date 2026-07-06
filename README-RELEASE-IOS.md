# 🍎 아이폰 앱 출시 - 따라만 하기 (프로세스별)

## 비용 정리
| 경로 | 비용 |
|---|---|
| PWA 설치(사파리→홈 화면에 추가) | **0원** |
| 내 폰에만 설치(무료 Apple ID) | **0원** (7일마다 재설치) |
| 앱스토어 출시 | Apple Developer Program **연 $99** — 애플 정책상 무료 불가 |

## 프로세스 1. 준비  ⏱ 30분
1) **Mac 필수** (윈도우로는 불가) + App Store에서 **Xcode** 설치(무료, 용량 큼)
2) Xcode 첫 실행 → 추가 구성요소 설치 동의
**체크**: 터미널에 `xcodebuild -version` → 버전 표시되면 OK

## 프로세스 2. iOS 프로젝트 추가  ⏱ 5분
안드로이드 가이드의 프로세스 2~3을 먼저 완료했다면 같은 폴더에서:
```
npm install @capacitor/ios
npx cap add ios
npx cap sync
npx cap open ios
```
**체크**: Xcode가 열리고 왼쪽에 App 프로젝트가 보이면 OK
- ❗오류 "CocoaPods": 터미널에서 `sudo gem install cocoapods` 후 다시 `npx cap sync`

## 프로세스 3. 서명 설정  ⏱ 5분
Xcode 좌측 App 클릭 → **Signing & Capabilities** 탭
→ "Automatically manage signing" 체크 → Team에서 본인 Apple ID 추가/선택
→ Bundle Identifier를 고유하게: `com.본인이름.blockbuster`
**체크**: 빨간 오류 없이 "Provisioning Profile: Xcode Managed" 표시

## 프로세스 4. 내 아이폰에서 테스트  ⏱ 10분
1) 아이폰 케이블 연결 → 상단 기기 선택에서 내 아이폰 → ▶ 실행
2) 폰에서 "신뢰하지 않는 개발자" 뜨면: 설정→일반→VPN 및 기기관리→본인 ID 신뢰
**체크리스트**: 기본 블록버스터 / "TETRIS" 해금 / 로비에 `wss://호스팅주소` 입력 → 컴퓨터·안드로이드와 대전!
- ❗iOS는 보안상 `ws://`(비암호화)를 차단할 수 있음 → **무료 호스팅의 wss:// 주소 사용을 강력 추천**

## 프로세스 5. 앱스토어 출시  ⏱ 1~2시간 + 심사 1~3일
1) https://developer.apple.com → Developer Program 가입(연 $99, 하루 정도 승인)
2) https://appstoreconnect.apple.com → "나의 앱 → +" → 앱 정보 입력(이름/카테고리 게임)
3) Xcode: 상단 기기를 **Any iOS Device**로 → 메뉴 **Product → Archive**
   → 완료 창에서 **Distribute App → App Store Connect → Upload**
4) App Store Connect로 돌아와: 스크린샷(6.7형 등 규격, 시뮬레이터 캡처 가능),
   설명, 개인정보처리방침 URL, 연령등급(4+) 입력 → 빌드 선택 → **심사 제출**
5) 보통 1~3일 내 결과. 통과 시 전세계 앱스토어 공개!
- ❗흔한 반려: 스크린샷 규격 불일치, 개인정보 URL 누락, 크래시(테스트 필수)
