require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 5000;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Lấy từ file .env

app.use(express.json());
app.use(cors());

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message)
      return res.status(400).json({ error: "Thiếu tin nhắn đầu vào!" });

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: "gpt-4",
        messages: [{ role: "user", content: message }],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ reply: response.data.choices[0].message.content });
  } catch (error) {
    console.error("Lỗi OpenAI API:", error.response?.data || error.message);
    res.status(500).json({ error: "Lỗi khi gọi OpenAI API" });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Server đang chạy tại http://127.0.0.1:${PORT}`)
);
