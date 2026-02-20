const firebaseConfig = {
    apiKey: "AIzaSyAvcbTesSOIXlS-QnfoBNNLlJc1fQ71VLs",
    authDomain: "wedding-guestbook-8da63.firebaseapp.com",
    projectId: "wedding-guestbook-8da63",
    storageBucket: "wedding-guestbook-8da63.firebasestorage.app",
    messagingSenderId: "570380033005",
    appId: "1:570380033005:web:6edbd32f4d8302cc9b65e4",
    // ★ 중요: 리얼타임 데이터베이스 주소를 여기에 꼭 확인해서 넣어줘!
    databaseURL: "https://wedding-guestbook-8da63-default-rtdb.firebaseio.com/"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(); // 기존 기능 유지용
const rtdb = firebase.database(); // 구글 시트 연결용 리얼타임 디비

// 계좌 복사
function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert("계좌번호가 복사되었습니다.");
    });
}

// 공유하기
function sharePage() {
    const url = window.location.href;
    if (navigator.share) {
        navigator.share({ title: "우리 결혼합니다!", url: url }).catch(console.error);
    } else {
        navigator.clipboard.writeText(url).then(() => { alert("링크가 복사되었습니다!"); });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // 아코디언 제어
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', function() {
            this.parentElement.classList.toggle('active');
        });
    });

    // RSVP 제어 (참석 여부도 리얼타임 디비에 저장해서 시트로 보내자!)
    const rsvpModal = document.getElementById('rsvpModal');
    document.getElementById('openRsvpModal').onclick = () => rsvpModal.style.display = 'flex';
    document.getElementById('closeRsvpBtn').onclick = () => rsvpModal.style.display = 'none';

    document.getElementById('submitRsvp').onclick = async () => {
        const name = document.getElementById('rsvpName').value;
        const count = document.getElementById('rsvpCount').value;
        if (name && count) {
            // Firestore 대신 rtdb에 저장
            await rtdb.ref("attendance").push({
                name: name, 
                count: parseInt(count), 
                timestamp: Date.now()
            });
            alert("전달되었습니다!");
            rsvpModal.style.display = "none";
        }
    };

    // --- 방명록 로직 시작 (리얼타임 데이터베이스 버전) ---
    const list = document.getElementById('guestbookList');

    // 데이터 읽어오기 (실시간으로 리스트 업데이트됨)
    rtdb.ref("messages").on("value", (snapshot) => {
        list.innerHTML = ""; // 일단 비우고
        const data = snapshot.val();
        for (let id in data) {
            const item = document.createElement('div');
            item.className = 'guestbook-item';
            item.innerHTML = `
                <span class="guestbook-message">${data[id].message}</span>
                <div class="guestbook-bottom">
                    <span class="guestbook-name">from. ${data[id].name}</span>
                </div>`;
            list.prepend(item); // 최신글이 위로 오게
        }
    });

    // 방명록 작성
    document.getElementById('submitGb').onclick = async () => {
        const name = document.getElementById('gbName').value;
        const message = document.getElementById('gbMsg').value;
        if (name && message) {
            await rtdb.ref("messages").push({
                name: name, 
                message: message, 
                timestamp: Date.now()
            });
            document.getElementById('gbName').value = ""; 
            document.getElementById('gbMsg').value = "";
            alert("등록되었습니다!");
        }
    };
    // --- 방명록 로직 끝 ---

    // 갤러리 모달 제어 (기존 동일)
    const imgModal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const thumbs = document.querySelectorAll('.gallery-grid img');
    let currentIndex = 0;

    function showImage(index) {
        if (index < 0) index = thumbs.length - 1;
        if (index >= thumbs.length) index = 0;
        currentIndex = index;
        modalImg.src = thumbs[currentIndex].src;
    }

    thumbs.forEach((img, index) => {
        img.onclick = () => {
            imgModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            showImage(index);
        };
    });

    document.getElementById('prevBtn').onclick = (e) => { e.stopPropagation(); showImage(currentIndex - 1); };
    document.getElementById('nextBtn').onclick = (e) => { e.stopPropagation(); showImage(currentIndex + 1); };
    document.getElementById('closeGallery').onclick = () => {
        imgModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };

    window.onclick = (e) => {
        if (e.target === rsvpModal) rsvpModal.style.display = 'none';
        if (e.target === imgModal) {
            imgModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };
});