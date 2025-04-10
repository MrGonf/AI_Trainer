function addNote() {
    const content = prompt("Nhập nội dung ghi chú:");
    if (content) {
        const newNote = document.createElement('div');
        newNote.className = 'option gray';
        newNote.innerText = content;
        const noteList = document.getElementById('noteList');
        noteList.insertBefore(newNote, noteList.lastElementChild);
    }
}
function gotoVideo(element) {
    const text = element.innerText;
    url = `${window.location.origin}/gotoVideo?note=${encodeURIComponent(text)}`;
        window.location.href = url; // Chuyển hướng trang
}
