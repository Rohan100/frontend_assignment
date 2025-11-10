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
    <div ref={rootRef} className="scroll-container relative bg-white" id="scroll-container">
      {/* Loading */}
      <div className="loading-overlay" id="loading-overlay">Loading <span className="loading-counter" id="loading-counter">[00]</span></div>
      <div className="debug-info fixed bottom-[10px] right-[10px] bg-[rgba(255,255,255,0.7)] text-black p-[10px] text-[12px] z-[9000] font-mono hidden" id="debug-info">Current Section: 0</div>

      <div className="fixed-section relative bg-white h-[1100vh]" id="fixed-section">
        <div className="fixed-container sticky top-0 left-0 w-full h-screen overflow-hidden will-change-[transform,height] origin-top bg-white" id="fixed-container" style={{maxWidth:"100vw!important",width:"100vw!important"}}>
          <div className="background-container absolute top-0 left-0 w-full h-full z-1 overflow-hidden bg-black" id="background-container">
            {images.map((src, i) => (
              <img key={i} src={src} alt={`Background ${i+1}`} className={`background-image absolute top-[-10%] left-0 w-full h-[120%] object-cover opacity-0 brightness-80 will-change-transform origin-center ${i===0 ? 'active':''}`} id={`background-${i+1}`} />
            ))}
          </div>

          <div className="grid-container grid grid-cols-12 gap-4 px-8 h-full relative z-[2]">
            <div className="header col-span-12 self-start pt-[5vh] text-[10vw] leading-[0.8] text-center text-[color:var(--text-color)] will-change-[transform,filter,opacity]">
              <div className="header-row block">The Creative</div>
              <div className="header-row block">Process</div>
            </div>

            <div className="content">
              <div className="left-column text-left" id="left-column">
                {left.map((label, i) => (
                  <div key={i} className={`artist pl-0 ${i===0 ? 'active loaded' : ''}`} id={`artist-${i}`} data-index={i}>{label}</div>
                ))}
              </div>

              <div className="featured" id="featured">
                {mid.map((label, i) => (
                  <div key={i} className={`featured-content ${i===0 ? 'active':''}`} id={`featured-${i}`} data-index={i}>
                    <h3>{label}</h3>
                  </div>
                ))}
              </div>

              <div className="right-column text-right" id="right-column">
                {right.map((label, i) => (
                  <div key={i} className={`category pr-0 ${i===0 ? 'active loaded' : ''}`} id={`category-${i}`} data-index={i}>{label}</div>
                ))}
              </div>
            </div>

            <div className="footer" id="footer">
              <div className="header-row block">Beyond</div>
              <div className="header-row block">Thinking</div>
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

      <div className="end-section relative h-screen bg-white flex items-center justify-center text-[2rem]">
        <p className="fin sticky top-[50vh] rotate-90 text-black">fin</p>
      </div>

    </div>
  )
}
