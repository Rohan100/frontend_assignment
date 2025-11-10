'use client'
import React, { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomEase } from 'gsap/CustomEase'
import Lenis from 'lenis'

// Helper to safely register once
if (typeof window !== 'undefined' && gsap.core) {
  if (!gsap.core.globals().ScrollTrigger) gsap.registerPlugin(ScrollTrigger)
  if (!gsap.core.globals().CustomEase) gsap.registerPlugin(CustomEase)
}

// --- Lightweight SplitText replacement (words only) ---
function splitWordsIntoMasks(el) {
  if (!el) return []
  const text = el.textContent || ''
  el.textContent = ''
  const words = text.split(/\s+/).filter(Boolean)
  const wordSpans = []
  words.forEach((w, i) => {
    const mask = document.createElement('span')
    mask.className = 'word-mask'
    const span = document.createElement('span')
    span.className = 'split-word'
    span.textContent = w + (i < words.length - 1 ? ' ' : '')
    mask.appendChild(span)
    el.appendChild(mask)
    wordSpans.push(span)
  })
  return wordSpans
}

// --- Sound Manager ---
class SoundManager {
  constructor() {
    this.sounds = {}
    this.isEnabled = false
    this._init()
  }
  _init() {
    this._load('hover', 'https://assets.codepen.io/7558/click-reverb-001.mp3', 0.15)
    this._load('click', 'https://assets.codepen.io/7558/shutter-fx-001.mp3', 0.3)
    this._load('textChange', 'https://assets.codepen.io/7558/whoosh-fx-001.mp3', 0.3)
  }
  _load(name, url, volume) {
    const audio = new Audio(url)
    audio.preload = 'auto'
    audio.volume = volume
    this.sounds[name] = audio
  }
  enable() { this.isEnabled = true }
  play(name, delay = 0) {
    if (!this.isEnabled || !this.sounds[name]) return
    const act = () => { this.sounds[name].currentTime = 0; this.sounds[name].play().catch(() => {}) }
    if (delay > 0) setTimeout(act, delay); else act()
  }
}

export default function CreativeProcessScroll() {
  const rootRef = useRef(null)
  const soundRef = useRef(null)
  const lenisRef = useRef(null)
  const stateRef = useRef({ currentSection: 0, isAnimating: false, isSnapping: false, lastProgress: 0 })

  const images = useMemo(() => [
    'https://assets.codepen.io/7558/flame-glow-blur-001.jpg',
    'https://assets.codepen.io/7558/flame-glow-blur-002.jpg',
    'https://assets.codepen.io/7558/flame-glow-blur-003.jpg',
    'https://assets.codepen.io/7558/flame-glow-blur-004.jpg',
    'https://assets.codepen.io/7558/flame-glow-blur-005.jpg',
    'https://assets.codepen.io/7558/flame-glow-blur-006.jpg',
    'https://assets.codepen.io/7558/flame-glow-blur-007.jpg',
    'https://assets.codepen.io/7558/flame-glow-blur-008.jpg',
    'https://assets.codepen.io/7558/flame-glow-blur-009.jpg',
    'https://assets.codepen.io/7558/flame-glow-blur-010.jpg',
  ], [])

  const left = ['Silence','Meditation','Intuition','Authenticity','Presence','Listening','Curiosity','Patience','Surrender','Simplicity']
  const mid = ['Creative Elements','Inner Stillness','Deep Knowing','True Expression','Now Moment','Deep Attention','Open Exploration','Calm Waiting','Let Go Control','Pure Essence']
  const right = ['Reduction','Essence','Space','Resonance','Truth','Feeling','Clarity','Emptiness','Awareness','Minimalism']

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const sound = new SoundManager()
    soundRef.current = sound

    CustomEase.create('customEase', 'M0,0 C0.86,0 0.07,1 1,1')

    // Smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      smoothTouch: false,
      touchMultiplier: 2,
    })
    lenisRef.current = lenis
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((t) => lenis.raf(t * 1000))
    gsap.ticker.lagSmoothing(0)

    const q = (sel) => root.querySelector(sel)
    const qa = (sel) => Array.from(root.querySelectorAll(sel))

    const loadingOverlay = q('#loading-overlay')
    const loadingCounter = q('#loading-counter')
    const fixedContainer = q('#fixed-container')
    const fixedSectionElement = q('.fixed-section')
    const header = q('.header')
    const content = q('.content')
    const footer = q('#footer')
    const leftColumn = q('#left-column')
    const rightColumn = q('#right-column')
    const featured = q('#featured')
    const backgrounds = qa('.background-image')
    const artists = qa('.artist')
    const categories = qa('.category')
    const featuredContents = qa('.featured-content')
    const progressFill = q('#progress-fill')
    const currentSectionDisplay = q('#current-section')

    // Loading counter
    let counter = 0
    const counterInterval = setInterval(() => {
      counter += Math.random() * 3 + 1
      if (counter >= 100) {
        counter = 100
        clearInterval(counterInterval)
        setTimeout(() => {
          gsap.to(loadingOverlay.querySelector('.loading-counter'), { opacity: 0, y: -20, duration: 0.6, ease: 'power2.inOut' })
          gsap.to(loadingOverlay.childNodes[0], { opacity: 0, y: -20, duration: 0.6, ease: 'power2.inOut', onComplete: () => {
            gsap.to(loadingOverlay, { y: '-100%', duration: 1.2, ease: 'power3.inOut', delay: 0.3, onComplete: () => {
              loadingOverlay.style.display = 'none'
              animateColumns()
            }})
          }})
        }, 200)
      }
      loadingCounter.textContent = `[${Math.floor(counter).toString().padStart(2,'0')}]`
    }, 30)

    // Stagger columns after load
    function animateColumns() {
      qa('.artist').forEach((item, i) => setTimeout(() => item.classList.add('loaded'), i * 60))
      qa('.category').forEach((item, i) => setTimeout(() => item.classList.add('loaded'), i * 60 + 200))
    }

    // Featured text splitting
    const splitMap = {}
    featuredContents.forEach((c, i) => {
      const h3 = c.querySelector('h3')
      const words = splitWordsIntoMasks(h3)
      splitMap[`featured-${i}`] = words
      words.forEach((w) => {
        if (i !== 0) gsap.set(w, { yPercent: 100, opacity: 0 })
        else gsap.set(w, { yPercent: 0, opacity: 1 })
      })
    })

    const total = 10
    const fixedTop = fixedSectionElement.offsetTop
    const fixedHeight = fixedSectionElement.offsetHeight
    const sectionPositions = Array.from({ length: total }, (_, i) => fixedTop + (fixedHeight * i) / total)

    function updateProgressNumbers() {
      const { currentSection } = stateRef.current
      currentSectionDisplay.textContent = (currentSection + 1).toString().padStart(2, '0')
    }

    function changeSection(next) {
      const state = stateRef.current
      if (next === state.currentSection || state.isAnimating) return
      state.isAnimating = true
      const prev = state.currentSection
      const isDown = next > prev
      state.currentSection = next

      updateProgressNumbers()
      progressFill.style.width = `${(state.currentSection / (total - 1)) * 100}%`

      // featured text
      if (splitMap[`featured-${prev}`]) {
        gsap.to(splitMap[`featured-${prev}`], { yPercent: isDown ? -100 : 100, opacity: 0, duration: 0.64 * 0.6, stagger: isDown ? 0.03 : -0.03, ease: 'customEase' })
      }
      const newWords = splitMap[`featured-${next}`] || []
      sound.enable(); sound.play('textChange', 250)
      gsap.set(featuredContents[next], { visibility: 'visible', opacity: 1 })
      gsap.set(newWords, { yPercent: isDown ? 100 : -100, opacity: 0 })
      gsap.to(newWords, { yPercent: 0, opacity: 1, duration: 0.64, stagger: isDown ? 0.05 : -0.05, ease: 'customEase' })

      backgrounds.forEach((bg, i) => {
        if (i === next) {
          gsap.set(bg, { opacity: 1, y: 0, clipPath: isDown ? 'inset(100% 0 0 0)' : 'inset(0 0 100% 0)' })
          gsap.to(bg, { clipPath: 'inset(0% 0 0 0)', duration: 0.64, ease: 'customEase' })
        } else if (i === prev) {
          gsap.to(bg, { y: isDown ? '5%' : '-5%', duration: 0.64, ease: 'customEase' })
          gsap.to(bg, { opacity: 0, delay: 0.32, duration: 0.32, ease: 'customEase', onComplete: () => { gsap.set(bg, { y: 0 }) } })
        } else {
          gsap.to(bg, { opacity: 0, duration: 0.2 })
        }
      })

      artists.forEach((el, i) => {
        if (i === next) { el.classList.add('active'); gsap.to(el, { opacity: 1, duration: 0.3 }) }
        else { el.classList.remove('active'); gsap.to(el, { opacity: 0.3, duration: 0.3 }) }
      })
      categories.forEach((el, i) => {
        if (i === next) { el.classList.add('active'); gsap.to(el, { opacity: 1, duration: 0.3 }) }
        else { el.classList.remove('active'); gsap.to(el, { opacity: 0.3, duration: 0.3 }) }
      })

      // allow interactions again
      gsap.delayedCall(0.7, () => { stateRef.current.isAnimating = false })
    }

    function navigateToSection(index) {
      const state = stateRef.current
      if (index === state.currentSection || state.isAnimating || state.isSnapping) return
      sound.enable(); sound.play('click')
      state.isSnapping = true
      changeSection(index)
      lenis.scrollTo(sectionPositions[index], { duration: 0.8, easing: (t) => 1 - Math.pow(1 - t, 3), lock: true, onComplete: () => { stateRef.current.isSnapping = false } })
    }

    // Click + hover events (enable audio on interaction)
    root.addEventListener('click', () => sound.enable(), { once: true })
    artists.forEach((a, i) => {
      a.addEventListener('click', (e) => { e.preventDefault(); navigateToSection(i) })
      a.addEventListener('mouseenter', () => { sound.enable(); sound.play('hover') })
    })
    categories.forEach((c, i) => {
      c.addEventListener('click', (e) => { e.preventDefault(); navigateToSection(i) })
      c.addEventListener('mouseenter', () => { sound.enable(); sound.play('hover') })
    })

    // Pin + snap watching
    gsap.set(fixedContainer, { height: '100vh' })
    ScrollTrigger.create({
      trigger: q('.fixed-section'),
      start: 'top top',
      end: 'bottom bottom',
      pin: fixedContainer,
      pinSpacing: true,
      onUpdate: (self) => {
        const state = stateRef.current
        if (state.isSnapping) return
        const progress = self.progress
        const targetSection = Math.min(9, Math.floor(progress * 10))
        if (targetSection !== state.currentSection && !state.isAnimating) {
          const next = state.currentSection + (targetSection > state.currentSection ? 1 : -1)
          // snap
          state.isSnapping = true
          changeSection(next)
          lenis.scrollTo(sectionPositions[next], { duration: 0.6, easing: (t) => 1 - Math.pow(1 - t, 3), lock: true, onComplete: () => { stateRef.current.isSnapping = false } })
        }
      }
    })

    // End section effects
    ScrollTrigger.create({
      trigger: q('.end-section'),
      start: 'top center',
      end: 'bottom bottom',
      onUpdate: (self) => {
        if (self.progress > 0.1) {
          footer.classList.add('blur'); leftColumn.classList.add('blur'); rightColumn.classList.add('blur'); featured.classList.add('blur')
          const newH = Math.max(0, 100 - ((self.progress - 0.1) / 0.9) * 100)
          gsap.to(fixedContainer, { height: `${newH}vh`, duration: 0.1 })
          const moveY = (-(self.progress - 0.1) / 0.9) * 200
          gsap.to(header, { y: moveY * 1.5, duration: 0.1 })
          gsap.to(content, { y: `calc(${moveY}px + (-50%))`, duration: 0.1 })
          gsap.to(footer, { y: moveY * 0.5, duration: 0.1 })
        } else {
          footer.classList.remove('blur'); leftColumn.classList.remove('blur'); rightColumn.classList.remove('blur'); featured.classList.remove('blur')
          gsap.to(fixedContainer, { height: '100vh', duration: 0.1 })
          gsap.to(header, { y: 0, duration: 0.1 })
          // gsap.to(content, { y: '-50%', duration: 0.1 })
          gsap.to(footer, { y: 0, duration: 0.1 })
        }
      }
    })

    // initial numbers
    updateProgressNumbers()

    return () => {
      clearInterval(counterInterval)
      ScrollTrigger.getAll().forEach((st) => st.kill())
      gsap.ticker.remove((t) => lenis.raf(t * 1000))
      lenis.destroy()
    }
  }, [])

  return (
    <div ref={rootRef} className="scroll-container" id="scroll-container">
      {/* Loading */}
      <div className="loading-overlay" id="loading-overlay">Loading <span className="loading-counter" id="loading-counter">[00]</span></div>
      <div className="debug-info" id="debug-info">Current Section: 0</div>

      <div className="fixed-section" id="fixed-section">
        <div className="fixed-container" id="fixed-container" style={{maxWidth:"100vw!important",width:"100vw!important"}}>
          <div className="background-container" id="background-container">
            {images.map((src, i) => (
              <img key={i} src={src} alt={`Background ${i+1}`} className={`background-image ${i===0 ? 'active':''}`} id={`background-${i+1}`} />
            ))}
          </div>

          <div className="grid-container">
            <div className="header">
              <div className="header-row">The Creative</div>
              <div className="header-row">Process</div>
            </div>

            <div className="content">
              <div className="left-column" id="left-column">
                {left.map((label, i) => (
                  <div key={i} className={`artist ${i===0 ? 'active loaded' : ''}`} id={`artist-${i}`} data-index={i}>{label}</div>
                ))}
              </div>

              <div className="featured" id="featured">
                {mid.map((label, i) => (
                  <div key={i} className={`featured-content ${i===0 ? 'active':''}`} id={`featured-${i}`} data-index={i}>
                    <h3>{label}</h3>
                  </div>
                ))}
              </div>

              <div className="right-column" id="right-column">
                {right.map((label, i) => (
                  <div key={i} className={`category ${i===0 ? 'active loaded' : ''}`} id={`category-${i}`} data-index={i}>{label}</div>
                ))}
              </div>
            </div>

            <div className="footer" id="footer">
              <div className="header-row">Beyond</div>
              <div className="header-row">Thinking</div>
              <div className="progress-indicator">
                <div className="progress-numbers">
                  <span id="current-section">01</span>
                  <span id="total-sections">10</span>
                </div>
                <div className="progress-fill" id="progress-fill"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="end-section">
        <p className="fin">fin</p>
      </div>

      <style jsx>{`
        @import url('https://fonts.cdnfonts.com/css/pp-neue-montreal');
        :root { --font-primary: 'PP Neue Montreal', sans-serif; --text-color: rgba(245,245,245,0.9); }
        *{margin:0;padding:0;box-sizing:border-box}
        html,body{overflow-x:hidden;width:100%}
        body{font-family:var(--font-primary);background:#fff;color:#000;font-weight:500;letter-spacing:-.02em;text-transform:uppercase}
        .scroll-container{position:relative;background:#fff}
        .end-section{font-size:2rem;height:100vh;position:relative;background:#fff;display:flex;align-items:center;justify-content:center}
        .fin{transform:rotate(90deg);position:sticky;top:50vh;color:#000}
        .fixed-section{height:1100vh;position:relative;background:#fff}
        .fixed-container{position:sticky;top:0;left:0;width:100%;height:100vh;overflow:hidden;will-change:transform,height;transform-origin:top center;background:#fff}
        .grid-container{display:grid;grid-template-columns:repeat(12,1fr);gap:1rem;padding:0 2rem;height:100%;position:relative;z-index:2}
        .background-container{position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;overflow:hidden;background:#000}
        .background-image{position:absolute;top:-10%;left:0;width:100%;height:120%;object-fit:cover;opacity:0;filter:brightness(.8);will-change:transform;transform-origin:center center}
        .background-image.active{opacity:1;z-index:2}
        .background-image.previous{opacity:1;z-index:1}
        .header{grid-column:1/13;align-self:start;padding-top:5vh;font-size:10vw;line-height:.8;text-align:center;color:var(--text-color);will-change:transform,filter,opacity}
        .header-row{display:block}
        .footer{grid-column:1/13;align-self:end;padding-bottom:5vh;font-size:10vw;line-height:.8;text-align:center;color:var(--text-color);will-change:transform,filter,opacity;transition:filter .5s ease, opacity .5s ease}
        .progress-indicator{width:160px;height:1px;margin:2vh auto 0;position:relative;background:rgba(245,245,245,.3)}
        .progress-fill{position:absolute;top:0;left:0;height:100%;width:0;background:var(--text-color);transition:width .3s cubic-bezier(.65,0,.35,1)}
        .progress-numbers{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;font-size:.7rem;color:var(--text-color);font-family:var(--font-primary);letter-spacing:-.02em;transform:translateY(-50%);margin:0 -25px}
        .footer.blur,.left-column.blur,.right-column.blur{filter:blur(8px);opacity:.3;transition:filter .8s ease, opacity .8s ease}
        .content{grid-column:1/13;display:flex;justify-content:space-between;align-items:center;width:100%;position:absolute;top:50%;left:0;transform:translateY(-50%);padding:0 2rem;will-change:transform}
        .left-column,.right-column{width:40%;display:flex;flex-direction:column;gap:.25rem;transition:filter .5s ease, opacity .5s ease}
        .left-column{text-align:left}
        .right-column{text-align:right}
        .featured{width:20%;display:flex;justify-content:center;align-items:center;text-align:center;font-size:1.5vw;position:relative;height:10vh;overflow:hidden;transition:filter .5s ease, opacity .5s ease}
        .featured.blur{filter:blur(8px);opacity:.3;transition:filter .8s ease, opacity .8s ease}
        .featured-content{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;justify-content:center;align-items:center;opacity:0;visibility:hidden}
        .featured-content.active{opacity:1;visibility:visible}
        .featured-content h3{white-space:nowrap;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:100%;margin:0;font-weight:500;color:var(--text-color)}
        .word-mask{display:inline-block;overflow:hidden;vertical-align:middle}
        .split-word{display:inline-block;vertical-align:middle}
        .artist,.category{opacity:0;transform:translateY(20px);transition:all .5s cubic-bezier(.16,1,.3,1);color:var(--text-color);cursor:pointer;position:relative}
        .artist{padding-left:0}
        .category{padding-right:0}
        .artist:hover,.category:hover{opacity:1 !important}
        .artist.loaded,.category.loaded{opacity:.3;transform:translateY(0)}
        .artist.active{opacity:1;transform:translateX(10px);padding-left:15px;transition:all .5s cubic-bezier(.16,1,.3,1)}
        .artist.active::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:4px;height:4px;background:var(--text-color);border-radius:50%}
        .category.active{opacity:1;transform:translateX(-10px);padding-right:15px;transition:all .5s cubic-bezier(.16,1,.3,1)}
        .category.active::after{content:'';position:absolute;right:0;top:50%;transform:translateY(-50%);width:4px;height:4px;background:var(--text-color);border-radius:50%}
        .loading-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;display:flex;justify-content:center;align-items:center;z-index:9999;color:#000;font-size:1.5rem;font-family:var(--font-primary);text-transform:uppercase;letter-spacing:-.02em}
        .loading-counter{margin-left:.5rem}
        .debug-info{position:fixed;bottom:10px;right:10px;background:rgba(255,255,255,.7);color:#000;padding:10px;font-size:12px;z-index:9000;font-family:monospace;display:none}
        @media (max-width:768px){
          .content{flex-direction:column;gap:5vh}
          .left-column,.right-column,.featured{width:100%;text-align:center}
          .featured{font-size:3vw;order:-1;margin-bottom:2vh}
          .header,.footer{font-size:15vw}
          .progress-indicator{width:120px}
        }
      `}</style>
    </div>
  )
}
