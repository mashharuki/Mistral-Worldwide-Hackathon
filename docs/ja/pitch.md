---
marp: true
theme: gaia
backgroundColor: #0f172a
paginate: true
_paginate: false
style: |
  /* Custom Global Styles */
  :root {
    --color-foreground: #cbd5e1;
    --color-background: #0f172a;
    --color-highlight: #3b82f6;
  }
  section {
    font-family: 'Inter', system-ui, sans-serif;
    color: #f8fafc;
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
    padding: 0 !important;
  }
  img[src*="center"] {
    display: block;
    margin: 0 auto;
  }
  .slide-bg {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: -1;
    overflow: hidden;
  }
  .slide-bg::after {
    content: '';
    position: absolute;
    width: 200%; height: 200%;
    top: -50%; left: -50%;
    background: radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%);
    animation: rotate 60s linear infinite;
  }
  @keyframes rotate { 100% { transform: rotate(360deg); } }
---

<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        brand: {
          400: '#60a5fa',
          500: '#3b82f6',
          900: '#1e3a8a',
        }
      },
      boxShadow: {
        'neon': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }
    }
  }
}
</script>

<!-- Slide 1: Title -->
<div class="h-full w-full relative flex flex-col justify-center items-center text-center px-10">
<div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639762681485-074b7f4fc8bc?q=80&w=2832&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
<div class="slide-bg"></div>

<div class="backdrop-blur-xl bg-slate-900/40 border border-slate-700/50 p-10 rounded-3xl shadow-glass transform transition-all z-10 w-full max-w-4xl">
<div class="flex justify-center mb-6 gap-6 text-5xl">
<div class="p-3 bg-brand-500/20 rounded-2xl border border-brand-500/30 text-brand-400">🎙️</div>
<div class="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30 text-purple-400">🛡️</div>
</div>
<h1 class="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400 mb-4 py-2 leading-normal tracking-tight">ZK Voice Agent</h1>
<p class="text-2xl text-slate-300 mb-8 font-light leading-relaxed">声で操作する、究極のプライバシー保護型スマートウォレット</p>
<div class="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2 rounded-full font-bold text-white text-sm shadow-[0_0_15px_rgba(59,130,246,0.5)]">
<span>Mistral Worldwide Hackathon</span>
</div>
</div>
</div>

---

<!-- Slide 2: Problem -->
<div class="h-full w-full flex flex-col p-10 relative overflow-hidden">
<div class="absolute top-0 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-[80px] z-0"></div>

<h2 class="text-4xl font-bold mb-8 py-2 leading-normal text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 z-10">
Web3普及の壁：<span class="text-red-400">UXとセキュリティのジレンマ</span>
</h2>

<div class="grid grid-cols-12 gap-6 h-full z-10">
<div class="col-span-7 flex flex-col justify-center space-y-4">
<div class="backdrop-blur-md bg-slate-800/60 p-5 rounded-2xl border border-rose-500/30 shadow-lg relative overflow-hidden text-sm">
<div class="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500"></div>
<h3 class="text-lg font-bold text-rose-400 mb-1 flex items-center gap-2"><span class="text-xl">🔑</span> 鍵管理の崩壊</h3>
<p class="text-slate-300 leading-snug">秘密鍵やシードフレーズの管理は一般ユーザーに難しすぎ、最大の障壁。</p>
</div>

<div class="backdrop-blur-md bg-slate-800/60 p-5 rounded-2xl border border-orange-500/30 shadow-lg relative overflow-hidden text-sm">
<div class="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500"></div>
<h3 class="text-lg font-bold text-orange-400 mb-1 flex items-center gap-2"><span class="text-xl">🤖</span> AI × 決済の需要爆発</h3>
<p class="text-slate-300 leading-snug">AIエージェント経済圏が拡大し、対話しながらのステーブルコイン決済が急増。</p>
</div>

<div class="backdrop-blur-md bg-slate-800/60 p-5 rounded-2xl border border-amber-500/30 shadow-lg relative overflow-hidden text-sm">
<div class="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500"></div>
<h3 class="text-lg font-bold text-amber-400 mb-1 flex items-center gap-2"><span class="text-xl">🛑</span> 既存ウォレットの限界</h3>
<p class="text-slate-300 leading-snug">手動署名モデルは、「AIとの自律的かつ連続的な決済」に不適合。</p>
</div>
</div>

<div class="col-span-5 flex flex-col justify-center items-center backdrop-blur-sm bg-slate-900/50 rounded-3xl border border-slate-700/50 p-6 shadow-2xl relative">
<div class="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/80 rounded-3xl z-0"></div>
<div class="z-10 text-center">
<div class="text-[80px] mb-3 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]">🤦‍♂️</div>
<p class="text-xl text-white font-bold leading-snug">「もっと自然で、<br>安全な方法は<br>ないのか？」</p>
</div>
</div>
</div>
</div>

---

<!-- Slide 3: Solution -->
<div class="h-full w-full flex flex-col p-10 relative">
<div class="absolute -top-40 -left-40 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[100px] pointer-events-none"></div>
<div class="absolute bottom-0 right-0 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>

<h2 class="text-4xl font-bold mb-1 py-1 leading-normal flex items-center gap-4">
<span class="bg-gradient-to-r from-brand-400 to-blue-200 bg-clip-text text-transparent py-1">ZK Voice Agent</span>
</h2>
<p class="text-lg text-slate-400 mb-4 font-light border-b border-slate-700/50 pb-2">「究極の生体認証」と「ゼロ知識証明」が生む次世代UX</p>

<div class="grid grid-cols-3 gap-5 flex-1 items-center">
<div class="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-5 rounded-3xl shadow-glass flex flex-col items-center text-center">
<div class="w-16 h-16 mb-3 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(59,130,246,0.4)]">🗣️</div>
<h3 class="text-lg font-bold text-white mb-2 py-1">音声対話 UI</h3>
<p class="text-slate-300 text-sm leading-relaxed">ElevenLabsのAI Agentと<span class="text-brand-400 font-bold">話すだけ</span>。<br/>ウォレット作成・送金・確認が手ぶらで完結。</p>
</div>

<div class="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-5 rounded-3xl shadow-glass flex flex-col items-center text-center">
<div class="w-16 h-16 mb-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(168,85,247,0.4)]">🛡️</div>
<h3 class="text-lg font-bold text-white mb-2 py-1">プライバシー</h3>
<p class="text-slate-300 text-sm leading-relaxed">声の特徴量は<span class="text-purple-400 font-bold">ZK-SNARK</span>でコミットメント化。<br/>生データは一切チェーンに公開しません。</p>
</div>

<div class="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-5 rounded-3xl shadow-glass flex flex-col items-center text-center">
<div class="w-16 h-16 mb-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(16,185,129,0.4)]">⚙️</div>
<h3 class="text-lg font-bold text-white mb-2 py-1">AA</h3>
<p class="text-slate-300 text-sm leading-relaxed"><span class="text-emerald-400 font-bold">ERC-4337準拠</span>。特徴量から決定論的に<br/>ウォレットを生成しガスレス送金を実現。</p>
</div>
</div>
</div>

---

<!-- Slide 4: Architecture & Tech Stack -->
<div class="h-full w-full p-10 relative">
<h2 class="text-3xl font-bold mb-6 flex items-center py-2 leading-normal"><span class="text-brand-400 mr-3">Architecture</span>裏側で何が起きているか？</h2>

<div class="grid grid-cols-2 gap-6 h-full items-center">
<div class="flex flex-col space-y-4">
<div class="flex items-start gap-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
<div class="flex-shrink-0 w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-lg font-bold border border-brand-500/50 shadow-neon">1</div>
<div>
<h3 class="text-base font-bold text-white mb-1">抽出 (Voice Extractor)</h3>
<p class="text-slate-300 text-xs leading-snug">自然な会話から、pyannoteを用いて声の埋め込み(512次)をリアルタイムに抽出。</p>
</div>
</div>

<div class="flex items-start gap-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
<div class="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-lg font-bold border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.5)]">2</div>
<div>
<h3 class="text-base font-bold text-white mb-1">証明 (Zero-Knowledge)</h3>
<p class="text-slate-300 text-xs leading-snug">Circom/Groth16で処理。特徴量を隠蔽したまま「本人の声」である証明を生成。</p>
</div>
</div>

<div class="flex items-start gap-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
<div class="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg font-bold border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.5)]">3</div>
<div>
<h3 class="text-base font-bold text-white mb-1">実行 (MCP + AA)</h3>
<p class="text-slate-300 text-xs leading-snug">LLMがMCPの8つのToolを駆使し、Smart Wallet経由でUserOp実行。</p>
</div>
</div>
</div>

<div class="backdrop-blur-xl bg-slate-900/60 p-5 rounded-3xl border border-slate-600/50 shadow-2xl relative overflow-hidden flex flex-col justify-center">
<div class="absolute inset-0 bg-gradient-to-br from-brand-600/10 to-purple-600/10 z-0"></div>
<h3 class="text-lg font-bold text-center text-white mb-4 z-10 tracking-widest uppercase border-b border-slate-700/50 pb-2">Technology Stack</h3>

<div class="space-y-2 z-10 w-full px-3 text-xs">
<div class="flex justify-between items-center border-b border-slate-700/50 pb-1.5">
<span class="text-slate-400">AI Agent</span><span class="font-bold text-brand-300">ElevenLabs SDK, GPT-4</span>
</div>
<div class="flex justify-between items-center border-b border-slate-700/50 pb-1.5">
<span class="text-slate-400">Backend</span><span class="font-bold text-brand-300">Flask, pyannote, MCP(Hono)</span>
</div>
<div class="flex justify-between items-center border-b border-slate-700/50 pb-1.5">
<span class="text-slate-400">ZK Circuit</span><span class="font-bold text-purple-300">Circom 2.0, snarkjs</span>
</div>
<div class="flex justify-between items-center border-b border-slate-700/50 pb-1.5">
<span class="text-slate-400">Blockchain</span><span class="font-bold text-emerald-300">Base Sepolia, ERC-4337</span>
</div>
<div class="flex justify-between items-center">
<span class="text-slate-400">Frontend</span><span class="font-bold text-brand-300">React 19, Tailwind CSS</span>
</div>
</div>
</div>
</div>
</div>

---

<!-- Slide 5: The Challenge We Mastered -->
<div class="h-full w-full p-10 relative flex flex-col justify-center">
<div class="absolute -right-20 top-1/2 transform -translate-y-1/2 text-[250px] opacity-5">🏆</div>
<h2 class="text-3xl font-bold mb-6 py-2 leading-normal text-center text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">最も技術的に困難だった達成</h2>

<div class="flex gap-5 h-64">
<div class="flex-1 bg-gradient-to-b from-slate-800 to-slate-900 p-5 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden flex flex-col">
<div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-400"></div>
<h3 class="text-xl font-bold text-white mb-2 py-1">1. 声紋の秘匿化</h3>
<div class="w-10 h-1 bg-blue-500/50 mb-3 rounded"></div>
<p class="text-sm text-slate-300 leading-relaxed font-light break-words">ディープラーニング由来の音声特徴量（連続変数）をブロックチェーン上で判定するため、データを二値化し、ハミング距離を計算して判定する<strong>ゼロ知識証明の算術回路を一から構築</strong>。データを渡さない認証を実現。</p>
</div>

<div class="flex-1 bg-gradient-to-b from-slate-800 to-slate-900 p-5 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden flex flex-col">
<div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-pink-400"></div>
<h3 class="text-xl font-bold text-white mb-2 py-1">2. 超高度なLLMとの統合</h3>
<div class="w-10 h-1 bg-purple-500/50 mb-3 rounded"></div>
<p class="text-sm text-slate-300 leading-relaxed font-light break-words">最新の<strong>MCP規格(Model Context Protocol)</strong>を採用。「抽出」「証明生成」「送金」など<strong>8つの専用Tool</strong>を実装。自然な会話の流れから、自律的に安全なトランザクションを組むことに成功しました。</p>
</div>
</div>
</div>

---

<!-- Slide 6: Future & Ask -->
<div class="h-full w-full flex flex-col justify-center items-center text-center p-10 relative overflow-hidden">
<div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>

<div class="z-10 flex flex-col items-center">
<div class="text-6xl mb-5">🚀</div>
<h2 class="text-4xl font-extrabold py-2 leading-normal text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-white mb-5 max-w-4xl drop-shadow-2xl">
AI時代のための<br/>摩擦ゼロの決済インフラへ
</h2>
<p class="text-lg text-slate-300 mb-8 max-w-3xl font-light leading-relaxed">
パスワードも秘密鍵も不要。<br>あなたの「声」がスマートウォレットになる世界は実現可能です。<br>ZK Voice Agentは、AIエージェント経済圏の基盤となります。
</p>

<div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-full text-xl font-bold shadow-[0_0_30px_rgba(59,130,246,0.5)] border border-white/20">
ありがとうございました！
</div>

<div class="mt-8 backdrop-blur-md bg-black/40 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
<p class="text-sm text-slate-200 font-mono tracking-wider">https://mistral-worldwide-hackathon-fronten.vercel.app</p>
</div>
</div>
</div>
