const messageInput = document.querySelector(".message-input");
const chatBody = document.querySelector(".chat-body");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");

const API_PROXY_URL = "http://localhost:5000/api/chat";

const disableInput = (disable) => {
  messageInput.disabled = disable;
  sendMessageButton.disabled = disable;
};
const decodeHTMLEntities = (text) => {
  const doc = new DOMParser().parseFromString(text, "text/html");
  return doc.body.innerHTML;
};
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = formatMarkdown(decodeHTMLEntities(content));

  return div;
};

const scrollToBottom = () => {
  chatBody.lastChild?.scrollIntoView({ behavior: "smooth", block: "end" });
};

const formatMarkdown = (text) => {
  if (!text) return "";

  // Xử lý tiêu đề
  text = text
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Xử lý in đậm và in nghiêng
  text = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>");

  // Xử lý code block và inline code
  text = text
    .replace(/```([\s\S]+?)```/g, "<pre><code>$1</code></pre>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");

  // Xử lý link và hình ảnh
  text = text
    .replace(/\[([^\]]+)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(
      /!\[([^\]]+)\]\((.*?)\)/g,
      '<img src="$2" alt="$1" style="max-width:100%;">'
    );

  // Xử lý danh sách có thứ tự (dùng `match` thay vì replace nhiều lần)
  text = text.replace(/(\d+\.\s+.*(\n|$))+/g, (match) => {
    const items = match
      .trim()
      .replace(/\n/g, " ") // Thay đổi chỗ này để tránh ngắt dòng
      .split(/\d+\.\s+/) // Tách danh sách dựa trên số thứ tự
      .filter(Boolean) // Lọc bỏ khoảng trắng thừa
      .map((item) => `<li>${item.trim()}</li>`)
      .join("");
    return `<ol>${items}</ol>`;
  });

  // Xử lý danh sách không thứ tự (tương tự danh sách có thứ tự)
  text = text.replace(/([-*]\s+.*(\n|$))+/g, (match) => {
    const items = match
      .trim()
      .split("\n")
      .map((item) => `<li>${item.replace(/^[-*]\s*/, "")}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  });

  // Ngắt dòng sau dấu chấm nhưng bỏ qua số thập phân và URL
  text = text.replace(/(?<!\d)\. (?!\d)/g, ".<br>");

  return text;
};

const typeText = (element, text, speed = 20) => {
  let i = 0;
  const tempText = document.createElement("div"); // Lưu nội dung tạm thời
  const interval = setInterval(() => {
    if (i < text.length) {
      tempText.textContent += text[i++]; // Gõ từng ký tự nhưng không làm hỏng HTML
      element.textContent = tempText.textContent;
    } else {
      clearInterval(interval);
      element.innerHTML = text; // Khi hoàn tất, hiển thị HTML đúng định dạng
    }
  }, speed);
};

const generateBotResponse = async (userMessage, thinkingMessageDiv) => {
  try {
    const response = await fetch(API_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage }),
    });

    if (!response.ok) throw new Error(`API lỗi: ${response.status}`);

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Lỗi JSON: Phản hồi không hợp lệ từ server\n" + text);
    }

    const botMessageDiv = createMessageElement(
      '<svg class="bot-avatar"xmlns="http://www.w3.org/2000/svg"width="50"height="50"viewBox="0 0 1024 1024"> <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"></path></svg><div class="markdown-content"><div class="message-text"> </div></div>',
      "bot-message"
    );
    chatBody.replaceChild(botMessageDiv, thinkingMessageDiv);
    typeText(
      botMessageDiv.querySelector(".message-text"),
      formatMarkdown(data.reply)
    );
  } catch (error) {
    console.error("Lỗi API:", error.message);
    chatBody.replaceChild(
      createMessageElement(
        `<div class="message-text error">⚠️ ${error.message}</div>`,
        "bot-message"
      ),
      thinkingMessageDiv
    );
  }
  disableInput(false);
  scrollToBottom();
};

const handleOutGoingMessage = async (e) => {
  e.preventDefault();
  const userMessage = messageInput.value.trim();
  if (!userMessage) return;

  disableInput(true);
  messageInput.value = "";
  chatBody.appendChild(
    createMessageElement(
      `<div class="message-text">${userMessage}</div>`,
      "user-message"
    )
  );
  scrollToBottom();

  const thinkingMessageDiv = createMessageElement(
    `<svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
      <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"/>
    </svg>
    <div class="message-text">
      <div class="thinking-indicator">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    </div>`,
    "bot-message",
    "thinking"
  );

  chatBody.appendChild(thinkingMessageDiv);
  scrollToBottom();

  await generateBotResponse(userMessage, thinkingMessageDiv);
};

messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && messageInput.value.trim()) {
    handleOutGoingMessage(e);
  }
});
const sendPDF = async (file) => {
  if (!file || file.type !== "application/pdf") {
    console.error("Chỉ hỗ trợ file PDF");
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    const pdfData = new Uint8Array(e.target.result);
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item) => item.str).join(" ") + "\n";
    }

    console.log("📄 Nội dung PDF:", text); // Kiểm tra nội dung PDF
    await sendToOpenAI(text, file.name);
  };

  reader.readAsArrayBuffer(file);
};

const sendToOpenAI = async (text, filename) => {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer YOUR_OPENAI_API_KEY",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "user", content: `Nội dung từ file ${filename}:\n\n${text}` },
        ],
      }),
    });

    if (!response.ok) throw new Error(`Lỗi API: ${response.status}`);

    const data = await response.json();
    console.log("🧠 Phản hồi OpenAI:", data.choices[0].message.content);
  } catch (error) {
    console.error("Lỗi khi gửi file:", error);
  }
};

fileInput.addEventListener("change", () => {
  const file = document.getElementById("file-input").files[0];
  if (file) sendPDF(file);
});

document
  .querySelector("#file-upload")
  .addEventListener("click", () => fileInput.click());

sendMessageButton.addEventListener("click", handleOutGoingMessage);
