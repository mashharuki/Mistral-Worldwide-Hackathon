---
marp: true
theme: gaia
backgroundColor: #fff
paginate: true
_paginate: false
style: |
  /* Custom Global Styles for Pitch Deck */
  :root {
    --color-foreground: #1e293b; /* slate-800 */
    --color-background: #ffffff;
    --color-highlight: #2563eb; /* blue-600 */
  }
  section {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    padding: 3rem;
  }
  h1, h2, h3, h4, h5, h6 {
    font-weight: 700;
  }
  /* Fix for Marp + Tailwind CDN image centering */
  img[src*="center"] {
    display: block;
    margin: 0 auto;
  }
---

<!-- 
  Install Tailwind CSS via CDN 
  Note: This requires an internet connection to render styles.
-->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Configure Tailwind Theme -->
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          primary: '#2563eb', // blue-600
          secondary: '#64748b', // slate-500
          accent: '#f59e0b', // amber-500
          dark: '#0f172a', // slate-900
          light: '#f8fafc', // slate-50
        }
      }
    }
  }
</script>

<!-- Slide 1: Title Slide -->
<div class="h-full flex flex-col justify-center items-center text-center bg-gradient-to-br from-blue-50 to-white -m-12 p-12">
  <div class="mb-8">
    <!-- Replace with Logo -->
    <div class="w-20 h-20 bg-primary rounded-xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
      L
    </div>
  </div>
  <h1 class="text-6xl font-extrabold text-dark tracking-tight mb-4">
    Project Name
  </h1>
  <p class="text-2xl text-secondary font-light max-w-2xl">
    A short, compelling tagline that explains <span class="text-primary font-medium">the value proposition</span> in one sentence.
  </p>
  <div class="mt-12 text-sm text-secondary uppercase tracking-widest font-semibold">
    Presenter Name • Date
  </div>
</div>

---

<!-- Slide 2: The Problem -->
<div class="h-full flex flex-col justify-center">
  <div class="mb-4 text-primary font-bold uppercase tracking-widest text-sm">The Challenge</div>
  <h2 class="text-5xl font-bold text-dark mb-12 leading-tight">
    The current process is <br>
    <span class="text-red-500 line-through decoration-4 decoration-red-200">slow & expensive</span>.
  </h2>

  <div class="grid grid-cols-3 gap-8">
    <div class="bg-red-50 p-6 rounded-xl border border-red-100">
      <div class="text-4xl mb-4">😫</div>
      <h3 class="text-xl font-bold text-red-800 mb-2">Frustrating</h3>
      <p class="text-red-700 text-sm">Users spend 40% of their time waiting for the system to load.</p>
    </div>
    <div class="bg-red-50 p-6 rounded-xl border border-red-100">
      <div class="text-4xl mb-4">💸</div>
      <h3 class="text-xl font-bold text-red-800 mb-2">Costly</h3>
      <p class="text-red-700 text-sm">Enterprises lose $100k+ annually on manual data entry errors.</p>
    </div>
    <div class="bg-red-50 p-6 rounded-xl border border-red-100">
      <div class="text-4xl mb-4">📉</div>
      <h3 class="text-xl font-bold text-red-800 mb-2">Inefficient</h3>
      <p class="text-red-700 text-sm">Team productivity drops by 20% due to context switching.</p>
    </div>
  </div>
</div>

---

<!-- Slide 3: The Solution -->
<div class="h-full flex items-center gap-12">
  <div class="flex-1">
    <div class="mb-4 text-primary font-bold uppercase tracking-widest text-sm">The Solution</div>
    <h2 class="text-5xl font-bold text-dark mb-6">Introducing <span class="text-primary">Product Name</span>.</h2>
    <p class="text-xl text-secondary mb-8 leading-relaxed">
      An AI-powered platform that automates the tedious parts of your workflow, so you can focus on what matters.
    </p>
    
    <ul class="space-y-4">
      <li class="flex items-center text-lg text-dark">
        <span class="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-sm">✓</span>
        <span><span class="font-bold">10x Faster</span> execution time</span>
      </li>
      <li class="flex items-center text-lg text-dark">
        <span class="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-sm">✓</span>
        <span><span class="font-bold">Zero</span> manual data entry</span>
      </li>
      <li class="flex items-center text-lg text-dark">
        <span class="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-sm">✓</span>
        <span>Seamless integration with <span class="font-bold">Existing Tools</span></span>
      </li>
    </ul>
  </div>
  
  <div class="flex-1 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-1 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
    <div class="bg-white rounded-xl h-80 flex items-center justify-center overflow-hidden relative">
      <div class="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400 font-medium">
        (Product Screenshot Placeholder)
      </div>
    </div>
  </div>
</div>

---

<!-- Slide 4: Market Opportunity -->
<div class="h-full flex flex-col justify-center">
  <h2 class="text-4xl font-bold text-dark mb-12 text-center">Market Opportunity</h2>
  
  <div class="flex justify-center items-end gap-16 text-center">
    <!-- TAM -->
    <div class="flex flex-col items-center group">
      <div class="w-48 h-48 rounded-full border-4 border-blue-100 bg-white flex flex-col items-center justify-center mb-6 shadow-lg group-hover:border-primary transition-colors">
        <div class="text-5xl font-extrabold text-dark">$10B</div>
        <div class="text-sm text-secondary font-semibold uppercase mt-2">TAM</div>
      </div>
      <p class="text-sm text-secondary max-w-[200px]">Total Addressable Market<br>Global Enterprise Software</p>
    </div>

    <!-- SAM -->
    <div class="flex flex-col items-center group">
      <div class="w-40 h-40 rounded-full border-4 border-blue-200 bg-blue-50 flex flex-col items-center justify-center mb-6 shadow-lg group-hover:border-primary transition-colors">
        <div class="text-4xl font-extrabold text-primary">$2.5B</div>
        <div class="text-sm text-primary font-semibold uppercase mt-2">SAM</div>
      </div>
      <p class="text-sm text-secondary max-w-[180px]">Serviceable Available Market<br>North America & Europe</p>
    </div>

    <!-- SOM -->
    <div class="flex flex-col items-center group">
      <div class="w-32 h-32 rounded-full border-4 border-primary bg-primary flex flex-col items-center justify-center mb-6 shadow-xl transform scale-110">
        <div class="text-3xl font-extrabold text-white">$100M</div>
        <div class="text-xs text-blue-100 font-semibold uppercase mt-1">SOM</div>
      </div>
      <p class="text-sm text-dark font-bold max-w-[150px]">Serviceable Obtainable Market<br>First 18 Months Target</p>
    </div>
  </div>
</div>

---

<!-- Slide 5: The Team -->
<div class="h-full flex flex-col justify-center">
  <h2 class="text-4xl font-bold text-dark mb-12 text-center">Our Team</h2>
  
  <div class="grid grid-cols-3 gap-12 px-12">
    <!-- Team Member 1 -->
    <div class="text-center">
      <div class="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 border-4 border-white shadow-md">
        <!-- Image Placeholder -->
      </div>
      <h3 class="text-xl font-bold text-dark">Jane Doe</h3>
      <p class="text-primary font-medium text-sm mb-2">CEO & Co-Founder</p>
      <p class="text-secondary text-sm leading-snug">Ex-Google PM. Led 3 products from 0 to 1M users. MBA from Stanford.</p>
    </div>

    <!-- Team Member 2 -->
    <div class="text-center">
      <div class="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 border-4 border-white shadow-md">
        <!-- Image Placeholder -->
      </div>
      <h3 class="text-xl font-bold text-dark">John Smith</h3>
      <p class="text-primary font-medium text-sm mb-2">CTO & Co-Founder</p>
      <p class="text-secondary text-sm leading-snug">10+ years backend engineering. Scaled systems to 10k RPS. Ex-Stripe.</p>
    </div>

    <!-- Team Member 3 -->
    <div class="text-center">
      <div class="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 border-4 border-white shadow-md">
         <!-- Image Placeholder -->
      </div>
      <h3 class="text-xl font-bold text-dark">Sarah Lee</h3>
      <p class="text-primary font-medium text-sm mb-2">Head of Design</p>
      <p class="text-secondary text-sm leading-snug">Award-winning designer. Previously at Airbnb and IDEO.</p>
    </div>
  </div>
</div>

---

<!-- Slide 6: Thank You / Ask -->
<div class="h-full flex flex-col justify-center items-center text-center bg-dark -m-12 p-12 text-white">
  <h2 class="text-5xl font-bold mb-8">Join Our Journey</h2>
  <div class="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 mb-12 max-w-2xl">
    <div class="text-2xl font-light mb-4">We are raising</div>
    <div class="text-6xl font-bold text-accent mb-4">$2,000,000</div>
    <div class="text-xl text-gray-300">Seed Round • 18 Months Runway</div>
  </div>
  
  <div class="grid grid-cols-2 gap-12 text-left">
    <div>
      <div class="text-gray-400 text-sm uppercase tracking-widest mb-1">Email</div>
      <div class="text-xl font-medium">founder@example.com</div>
    </div>
    <div>
      <div class="text-gray-400 text-sm uppercase tracking-widest mb-1">Website</div>
      <div class="text-xl font-medium">www.example.com</div>
    </div>
  </div>
</div>
