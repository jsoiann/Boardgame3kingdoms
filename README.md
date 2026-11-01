# 天下三分（規則 v0.2 測試版）
魏／蜀／吳 兩人輕策略。三種模式：隨機配對、開房間（連結）、對電腦。

## 放上 GitHub Pages
1. 新建 repo，上傳呢個資料夾全部檔案（index.html、engine.js、net.js、firebase-config.js、assets 資料夾）。
2. Settings → Pages → Branch 揀 main → Save，等一兩分鐘就有網址。

## 開啟線上模式（只做一次）
1. 去 console.firebase.google.com 建立專案 → Build → Realtime Database → Create（測試模式）。
2. Project settings → Your apps → Web，複製 config 貼入 `firebase-config.js`。
3. Realtime Database → Rules 貼上（測試期用，公開讀寫）：
   `{"rules":{".read":true,".write":true}}`

## 檔案
- `engine.js`　全部規則同數值（改平衡只需改呢個檔）；電腦對手 AI 都喺呢度
- `net.js`　　 房間同配對；所有動作按同一順序重播，保證雙方狀態一致
- `index.html` 介面　`assets/` 紙雕風圖片（由你生成嘅圖集切出）

## 已知限制
無動畫／音效、無斷線重連、動作紀錄公開（測試用）、電腦 AI 係簡單啟發式。
