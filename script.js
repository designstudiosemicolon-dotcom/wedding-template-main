const firebaseConfig = {
    apiKey: "AIzaSyAvcbTesSOIXlS-QnfoBNNLlJc1fQ71VLs",
    authDomain: "wedding-guestbook-8da63.firebaseapp.com",
    projectId: "wedding-guestbook-8da63",
    storageBucket: "wedding-guestbook-8da63.firebasestorage.app",
    messagingSenderId: "570380033005",
    appId: "1:570380033005:web:6edbd32f4d8302cc9b65e4"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

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

    // RSVP 제어
    const rsvpModal = document.getElementById('rsvpModal');
    document.getElementById('openRsvpModal').onclick = () => rsvpModal.style.display = 'flex';
    document.getElementById('closeRsvpBtn').onclick = () => rsvpModal.style.display = 'none';

    document.getElementById('submitRsvp').onclick = async () => {
        const name = document.getElementById('rsvpName').value;
        const count = document.getElementById('rsvpCount').value;
        if (name && count) {
            await db.collection("attendance").add({
                name: name, count: parseInt(count), timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert("전달되었습니다!");
            rsvpModal.style.display = "none";
        }
    };

    // --- 방명록 페이징 로직 시작 ---
    let lastVisible = null; // 마지막으로 가져온 데이터 위치
    const pageSize = 5; // 한 번에 가져올 개수
    const list = document.getElementById('guestbookList');
    const loadMoreBtn = document.getElementById('loadMoreGb');

    async function loadMessages(isFirst = false) {
        let query = db.collection("messages").orderBy("timestamp", "desc").limit(pageSize);
        
        if (!isFirst && lastVisible) {
            query = query.startAfter(lastVisible);
        }

        const snapshot = await query.get();
        if (snapshot.empty) {
            loadMoreBtn.style.display = 'none';
            return;
        }

        lastVisible = snapshot.docs[snapshot.docs.length - 1];

        snapshot.forEach((doc) => {
            const data = doc.data();
            const item = document.createElement('div');
            item.className = 'guestbook-item';
            item.innerHTML = `
                <span class="guestbook-message">${data.message}</span>
                <div class="guestbook-bottom">
                    <span class="guestbook-name">from. ${data.name}</span>
                </div>`;
            list.appendChild(item);
        });

        // 가져온 데이터가 pageSize보다 적으면 더보기 버튼 숨김
        if (snapshot.docs.length < pageSize) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
        }
    }

    // 초기 로드
    loadMessages(true);

    // 더보기 클릭
    loadMoreBtn.onclick = () => loadMessages();

    // 방명록 작성 (작성 후에는 새로고침 없이 상단에 즉시 반영하기 위해 간단히 처리)
    document.getElementById('submitGb').onclick = async () => {
        const name = document.getElementById('gbName').value;
        const message = document.getElementById('gbMsg').value;
        if (name && message) {
            await db.collection("messages").add({
                name: name, message: message, timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            document.getElementById('gbName').value = ""; 
            document.getElementById('gbMsg').value = "";
            alert("등록되었습니다! 페이지를 새로고침하면 확인하실 수 있습니다.");
            // 팁: 실제 운영 시에는 list.innerHTML = "" 하고 loadMessages(true)를 다시 호출하면 깔끔해!
        }
    };
    // --- 방명록 페이징 로직 끝 ---

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