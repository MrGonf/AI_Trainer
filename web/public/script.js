const messageInput = document.querySelector(".message-input");
const chatBody = document.querySelector(".chat-body");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const userData = {};

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
  // Sửa phần xử lý danh sách có thứ tự
  text = text.replace(
    /(?:^|\n)((\d+\.\s+.*|^\s*\n)(?:\n(?!\d+\.\s).*)*)+/g,
    (match) => {
      const items = match
        .split(/\n(?=\d+\.\s)/)
        .filter((item) => item.trim()) // Lọc bỏ các dòng trống
        .map((item) => {
          // Xử lý cả trường hợp dòng trống giữa các mục
          const content = item.replace(/^\d+\.\s*/, "").trim();
          return content ? `<li>${content.replace(/\n/g, "<br>")}</li>` : "";
        })
        .filter(Boolean) // Lọc bỏ các mục rỗng
        .join("\n");

      return items ? `<ol>\n${items}\n</ol>` : "";
    }
  );

  // Gộp các thẻ <ol> liền kề và xử lý khoảng trắng
  text = text
    .replace(/<\/ol>\s*<ol>/g, "\n")
    .replace(/(<ol>)\s+/g, "$1")
    .replace(/\s+(<\/ol>)/g, "$1");

  // Xử lý danh sách không thứ tự (tương tự danh sách có thứ tự)
  text = text.replace(/([-*]\s+.*(\n|$))+/g, (match) => {
    const items = match
      .trim()
      .split("\n")
      .map((item, index) => {
        const content = item.replace(/^\d+\.\s*/, "").trim();
        return content
          ? `<li>${content.replace(/\n/g, "<br>")}</li>`
          : `<li class="empty-item">[Nội dung đang cập nhật]</li>`;
      })
      .join("");
    return `<ul>${items}</ul>`;
  });

  // Ngắt dòng sau dấu chấm nhưng bỏ qua số thập phân và URL
  text = text.replace(/(?<!\d)\. (?!\d)/g, ".<br>");

  return text;
};

const typeText = (element, text, speed = 10) => {
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
    const response = await sendChatGPTMessage(userMessage);
    if (!response) throw new Error("Không có phản hồi từ API");

    const botMessageDiv = createMessageElement(
      '<svg class="bot-avatar"xmlns="http://www.w3.org/2000/svg"width="50"height="50"viewBox="0 0 1024 1024"> <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"></path></svg><div class="markdown-content"><div class="message-text"> </div></div>',
      "bot-message"
    );
    chatBody.replaceChild(botMessageDiv, thinkingMessageDiv);
    typeText(
      botMessageDiv.querySelector(".message-text"),
      formatMarkdown(response)
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

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => { };
});

sendMessageButton.addEventListener("click", handleOutGoingMessage);

document
  .querySelector("#file-upload")
  .addEventListener("click", () => fileInput.click());

// const picker = new EmojiMart.Picker({
//   theme: "light",
//   skinTonePosition: "none",
//   previewPosition: "none",
//   onEmojiSelect: (emoji) => {
//     const { selectionStart: start, selectionEnd: end } = messageInput;
//     messageInput.setRangeText(emoji.native, start, end, "end");
//     messageInput.focus();
//   },
//   onClickOutside: (e) => {
//     if (e.target.id === "emoji-picker") {
//       document.body.classList.toggle("show-emoji-picker");
//     } else {
//       document.body.classList.remove("show-emoji-picker");
//     }
//   },
// });

const chatHistory = [];

async function sendChatGPTMessage(message) {
  try {
    if (!message) return "Thiếu tin nhắn đầu vào!";
    console.log("Gửi tin nhắn:", message);

    // Thêm tin nhắn người dùng vào lịch sử
    chatHistory.push({ role: "user", content: message });

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: chatHistory, // Gửi toàn bộ lịch sử
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Lỗi API:", errorData);
      throw new Error(`Lỗi HTTP ${response.status}: ${errorData.error?.message || "Không rõ nguyên nhân"}`);
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;

    // Thêm phản hồi vào lịch sử
    chatHistory.push({ role: "assistant", content: reply });

    console.log("Phản hồi:", reply);
    return reply || "Không có phản hồi từ API";
  } catch (error) {
    console.error("Lỗi OpenAI API:", error.message);
    return `Lỗi khi gọi OpenAI API: ${error.message}`;
  }
}


async function fetchFileContentAsText(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Không thể tải file");

    const contentType = response.headers.get("Content-Type");

    let content = "";
    if (contentType && contentType.startsWith("text/")) {
      content = await response.text();
    } else if (contentType === "application/pdf") {
      const blob = await response.blob();
      content = await blob.text(); // Cách này không tối ưu cho PDF phức tạp
    } else {
      return "Không thể đọc nội dung file này.";
    }

    // Giới hạn độ dài nội dung gửi lên OpenAI
    if (content.length > 5000) {
      content = content.substring(0, 5000) + "\n\n(Nội dung bị cắt bớt do quá dài)";
    }

    return content;
  } catch (error) {
    console.error("Lỗi khi lấy nội dung file:", error);
    return "Lỗi khi đọc file.";
  }
}

async function sendWithRetry(message, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    const response = await sendChatGPTMessage(message);
    if (!response.includes("Lỗi khi gọi OpenAI API")) return response;
    console.warn(`Thử lại (${i + 1}/${retries})...`);
    await new Promise((res) => setTimeout(res, delay));
  }
  return "Lỗi: Quá tải API, vui lòng thử lại sau.";
}

async function sendFileToChatGPT() {
  try {
    // 1. Fetch the file content
    const fileContent = await fetchFileContentAsText(`/GetDocument?documentUrl=${documentUrl}`);
    // 2. Check if there was an error fetching the file
    if (fileContent.startsWith("Lỗi")) {
      // Handle the error appropriately (e.g., display an error message to the user)
      console.error("Error fetching file content:", fileContent);
      // You might want to display this error to the user in the chat interface
      chatBody.appendChild(
        createMessageElement(
          `<div class="message-text error">⚠️ ${fileContent}</div>`,
          "bot-message"
        )
      );
      scrollToBottom();
      return; // Exit the function early
    }

    // 3. Send the file content to ChatGPT
    const gptReply = await sendChatGPTMessage(`Đây là nội dung tài liệu:\n\n${fileContent}`);

    // 4. Check if there was an error sending the message to ChatGPT
    if (gptReply.startsWith("Lỗi")) {
      // Handle the error appropriately
      console.error("Error sending message to ChatGPT:", gptReply);
      // Display the error to the user
      chatBody.appendChild(
        createMessageElement(
          `<div class="message-text error">⚠️ ${gptReply}</div>`,
          "bot-message"
        )
      );
      scrollToBottom();
      return; // Exit the function early
    }

    // 5. Display the reply from ChatGPT
    console.log("GPT trả lời:", gptReply);
    chatBody.appendChild(
      createMessageElement(
        `<div class="message-text">Đã lưu tài liệu thành công</div>`,
        "bot-message"
      )
    );
    scrollToBottom();
  } catch (error) {
    console.error("An unexpected error occurred:", error);
    // Handle unexpected errors
    chatBody.appendChild(
      createMessageElement(
        `<div class="message-text error">⚠️ An unexpected error occurred: ${error.message}</div>`,
        "bot-message"
      )
    );
    scrollToBottom();
  }
}

setTimeout(() => {
  sendFileToChatGPT();
  console.log("Sau 1s delay");
}, 1000);


// // await sendFileToChatGPT(); // Hàm bạn đã viết sẵn ở cuối
// import { documentUrl } from './';
console.log("Document URL from EJS:", documentUrl); // Ví dụ sử dụng

