# Naver Booking → Google Calendar Helper

네이버 예약은 구글캘린더 연동이 안되서 만든 확장프로그램입니다.  
네이버 예약 상세/공유 페이지에서 예약 정보를 자동으로 추출해
원클릭으로 Google Calendar 일정 생성 화면을 열어주는 도구입니다.

## 주요 기능

- 네이버 예약 상세/공유 페이지 자동 감지
- 예약 제목·담당자·메뉴·일시·주소 자동 추출
- 원본 예약 링크 자동 포함
- Google Calendar 일정 생성 화면 자동 오픈
- 가벼운 플로팅 버튼 + 확인 팝업 UI 제공

## 설치 방법 (Chrome 개발자 모드)

_언젠가는 Chrome Web Store에 올릴 예정…_

1. 이 저장소를 다운로드(zip)하거나 `git clone` 합니다.
2. Chrome 주소창에 `chrome://extensions` 입력
3. 오른쪽 상단 **개발자 모드** 활성화
4. 왼쪽 상단 **압축 해제된 확장프로그램을 로드** 클릭
5. 프로젝트 폴더 선택
6. 네이버 예약 페이지에 들어가면 우하단에 **📅** 버튼이 나타납니다.
   
설치가 정상적으로 완료되면 아래와 같은 화면이 나타납니다.
### 설치 성공 화면 예시

우측 하단 아이콘 누르면 팝업 표시됩니다.  
<img width="1532" alt="extension-loaded" src="https://github.com/user-attachments/assets/85fd3d6f-b1af-4c90-a51f-54f9ff042055">  
<img width="474" alt="extension-list" src="https://github.com/user-attachments/assets/82fd9d7e-2136-4145-aa5f-b7f0600a8ec9">  

## 사용 방법

1. 네이버 예약 상세 페이지 또는 공유 링크를 엽니다.
2. 우하단의 📅 버튼을 클릭합니다.
3. 예약 정보 확인 팝업에서 **추가** 선택
4. Google Calendar 일정 생성 페이지가 자동으로 열립니다.

## 지원되는 페이지

- https://booking.naver.com/my/share/bookings/XXXXXXXX
- https://booking.naver.com/my/bookings/XXXXXXXX

## 제한 사항

- Google Calendar API 직접 호출은 지원하지 않습니다.  
  → 알림 시간 등은 캘린더의 기본 설정을 따릅니다.
- 네이버 예약 페이지 구조가 변경될 경우 일부 로직 수정이 필요할 수 있습니다.
