'use client';

import { useEffect, useState } from 'react';

interface ScreenSaverProps {
  isActive: boolean;
  onDismiss: () => void;
}

export default function ScreenSaver({ isActive, onDismiss }: ScreenSaverProps) {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    if (!isActive) return;

    // Rastgele kod satırları oluştur - Çok daha fazla ve karmaşık
    const codeSnippets = [
      'const encrypt = (data) => {',
      '  return btoa(data.toString());',
      '};',
      '',
      'class SecurityProtocol {',
      '  constructor() {',
      '    this.key = generateKey();',
      '    this.encrypted = true;',
      '  }',
      '  authenticate() {',
      '    return this.validateKey();',
      '  }',
      '}',
      '',
      'function decrypt(password) {',
      '  return atob(password);',
      '}',
      '',
      'const server = new Server({',
      '  address: "192.168.1.1",',
      '  port: 8080',
      '  secure: true',
      '});',
      '',
      'async function connect() {',
      '  await authenticate();',
      '  return true;',
      '}',
      '',
      'interface User {',
      '  id: number;',
      '  username: string;',
      '  password: string;',
      '}',
      '',
      'const hash = crypto.createHash("sha256");',
      'hash.update(password);',
      'const encrypted = hash.digest("hex");',
      '',
      'for (let i = 0; i < array.length; i++) {',
      '  processData(array[i]);',
      '}',
      '',
      'const token = jwt.sign({ user }, secret);',
      '',
      'function validateAccess() {',
      '  if (user.role === "admin") {',
      '    return true;',
      '  }',
      '  return false;',
      '}',
      '',
      'const connection = mysql.createConnection({',
      '  host: "localhost",',
      '  user: "root",',
      '  password: "********"',
      '});',
      '',
      'const apiKey = process.env.API_KEY;',
      '',
      'try {',
      '  const result = await query(sql);',
      '  return result;',
      '} catch (error) {',
      '  console.error(error);',
      '}',
      '',
      'class DatabaseManager {',
      '  async executeQuery(query) {',
      '    const conn = await pool.getConnection();',
      '    try {',
      '      return await conn.query(query);',
      '    } finally {',
      '      conn.release();',
      '    }',
      '  }',
      '}',
      '',
      'function hashPassword(pwd) {',
      '  const salt = crypto.randomBytes(16);',
      '  return crypto.pbkdf2Sync(pwd, salt, 1000, 64, "sha512");',
      '}',
      '',
      'const middleware = (req, res, next) => {',
      '  const token = req.headers.authorization;',
      '  if (!token) return res.status(401).json({ error: "Unauthorized" });',
      '  next();',
      '};',
      '',
      'router.post("/api/login", async (req, res) => {',
      '  const { username, password } = req.body;',
      '  const user = await User.findOne({ username });',
      '  if (!user) return res.status(404).json({ error: "User not found" });',
      '  const isValid = await bcrypt.compare(password, user.password);',
      '  if (isValid) {',
      '    const token = jwt.sign({ id: user.id }, SECRET_KEY);',
      '    res.json({ token });',
      '  }',
      '});',
      '',
      'class EncryptionService {',
      '  encrypt(data, key) {',
      '    const cipher = crypto.createCipher("aes256", key);',
      '    let encrypted = cipher.update(data, "utf8", "hex");',
      '    encrypted += cipher.final("hex");',
      '    return encrypted;',
      '  }',
      '}',
      '',
      'const express = require("express");',
      'const app = express();',
      'app.use(express.json());',
      'app.use(middleware);',
      '',
      'app.listen(3000, () => {',
      '  console.log("Server running on port 3000");',
      '});',
      '',
      'function validateInput(input) {',
      '  if (typeof input !== "string") return false;',
      '  if (input.length < 3) return false;',
      '  return /^[a-zA-Z0-9]+$/.test(input);',
      '}',
      '',
      'const WebSocket = require("ws");',
      'const wss = new WebSocket.Server({ port: 8080 });',
      'wss.on("connection", (ws) => {',
      '  ws.on("message", (message) => {',
      '    console.log("Received:", message);',
      '  });',
      '});',
      '',
      'const redis = require("redis");',
      'const client = redis.createClient();',
      'client.on("connect", () => {',
      '  console.log("Connected to Redis");',
      '});',
      '',
      'async function processQueue() {',
      '  while (true) {',
      '    const job = await queue.dequeue();',
      '    if (job) await executeJob(job);',
      '    await sleep(1000);',
      '  }',
      '}',
      '',
      'const mongoose = require("mongoose");',
      'mongoose.connect("mongodb://localhost:27017/mydb");',
      'const Schema = mongoose.Schema;',
      'const userSchema = new Schema({',
      '  name: String,',
      '  email: String,',
      '});',
      '',
      'function generateToken(user) {',
      '  const payload = {',
      '    id: user.id,',
      '    email: user.email,',
      '    role: user.role',
      '  };',
      '  return jwt.sign(payload, SECRET, { expiresIn: "24h" });',
      '}',
      '',
      'const axios = require("axios");',
      'async function fetchData(url) {',
      '  try {',
      '    const response = await axios.get(url);',
      '    return response.data;',
      '  } catch (error) {',
      '    throw new Error("Failed to fetch data");',
      '  }',
      '}',
      '',
      'class Logger {',
      '  log(message, level = "info") {',
      '    const timestamp = new Date().toISOString();',
      '    console.log(`[${timestamp}] [${level}] ${message}`);',
      '  }',
      '}',
      '',
      'const rateLimiter = require("express-rate-limit");',
      'const limiter = rateLimiter({',
      '  windowMs: 15 * 60 * 1000,',
      '  max: 100',
      '});',
      '',
      'app.use("/api/", limiter);',
      '',
      'function sanitizeInput(input) {',
      '  return input.replace(/[<>]/g, "");',
      '}',
      '',
      'const bcrypt = require("bcrypt");',
      'async function hashPassword(password) {',
      '  const saltRounds = 10;',
      '  return await bcrypt.hash(password, saltRounds);',
      '}',
    ];

    // İlk yükleme - düzenli ama yoğun göster
    const shuffled = [...codeSnippets].sort(() => Math.random() - 0.5);
    setLines(shuffled.slice(0, 80)); // 80 satır göster

    // Animasyon için satırları rastgele güncelle
    const interval = setInterval(() => {
      const shuffled = [...codeSnippets].sort(() => Math.random() - 0.5);
      setLines(shuffled.slice(0, 80));
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div 
      className="fixed inset-0 bg-black z-[100] overflow-hidden"
      onClick={(e) => {
        // Ekran koruyucusuna tıklanınca kapanmasın, sadece 11 butonuna tıklayınca kapansın
        e.preventDefault();
        e.stopPropagation();
      }}
      style={{
        backgroundImage: `
          linear-gradient(rgba(0, 255, 0, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 0, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        pointerEvents: 'auto',
      }}
    >
      {/* Sol üstte "-" butonu - hover'da görünür */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDismiss();
        }}
        className="absolute top-4 left-4 z-[101] text-green-400 text-xs font-mono hover:text-green-300 hover:opacity-100 transition-all cursor-pointer pointer-events-auto opacity-0"
        style={{ 
          textShadow: '0 0 5px #00ff00',
          userSelect: 'none',
        }}
      >
        -
      </button>

      {/* Kod satırları - düzenli grid yapısı, yoğun ama organize */}
      <div className="absolute inset-0 p-6 font-mono text-green-400 text-xs overflow-hidden pointer-events-none">
        {/* Sol kolon - dikey yoğun */}
        <div className="absolute top-6 left-6 w-1/4">
          {lines.slice(0, 25).map((line, idx) => (
            <div
              key={`left-${idx}`}
              className="mb-0 opacity-75"
              style={{
                animation: 'fadeIn 0.5s ease-in',
                textShadow: '0 0 5px #00ff00',
                lineHeight: '1.2',
              }}
            >
              {line}
            </div>
          ))}
        </div>
        
        {/* Orta sol kolon */}
        <div className="absolute top-6 left-1/4 w-1/4">
          {lines.slice(25, 50).map((line, idx) => (
            <div
              key={`middle-left-${idx}`}
              className="mb-0 opacity-70"
              style={{
                animation: 'fadeIn 0.7s ease-in',
                textShadow: '0 0 5px #00ff00',
                lineHeight: '1.2',
              }}
            >
              {line}
            </div>
          ))}
        </div>
        
        {/* Orta sağ kolon */}
        <div className="absolute top-6 right-1/4 w-1/4">
          {lines.slice(50, 75).map((line, idx) => (
            <div
              key={`middle-right-${idx}`}
              className="mb-0 opacity-70"
              style={{
                animation: 'fadeIn 0.8s ease-in',
                textShadow: '0 0 5px #00ff00',
                lineHeight: '1.2',
              }}
            >
              {line}
            </div>
          ))}
        </div>
        
        {/* Sağ kolon - dikey yoğun */}
        <div className="absolute top-6 right-6 w-1/4">
          {lines.slice(75, 80).map((line, idx) => (
            <div
              key={`right-${idx}`}
              className="mb-0 opacity-75"
              style={{
                animation: 'fadeIn 0.6s ease-in',
                textShadow: '0 0 5px #00ff00',
                lineHeight: '1.2',
              }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>

      {/* Arka planda akan kod efekti */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 255, 0, 0.03) 2px,
              rgba(0, 255, 0, 0.03) 4px
            )
          `,
        }}
      />
    </div>
  );
}

