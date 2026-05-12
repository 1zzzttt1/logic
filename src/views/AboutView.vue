<script setup lang="ts">
import { author } from '../data/author'

const sendEmail = () => {
  if (author.email) {
    window.location.href = `mailto:${author.email}`
  }
}

const openGitHub = () => {
  if (author.github) {
    window.open(`https://github.com/${author.github}`, '_blank')
  }
}
</script>

<template>
  <div class="about-page">
    <div class="about-container">
      <!-- Avatar -->
    

      <!-- Intro -->
      <section class="intro-section">
        <h1 class="greeting">你好，我是 {{ author.name }}</h1>
        <p class="bio">{{ author.bio }}</p>

        <div v-if="author.location" class="location">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex-shrink:0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          <span>{{ author.location }}</span>
        </div>
      </section>

      <!-- Contact -->
      <section class="contact-section">
        <h2 class="section-title">联系方式</h2>
        <div class="contact-links">
          <button
            v-if="author.email"
            class="contact-btn email-btn"
            @click="sendEmail"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex-shrink:0"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4l-10 7L2 4"/></svg>
            <span>发送邮件</span>
          </button>

          <button
            v-if="author.github"
            class="contact-btn github-btn"
            @click="openGitHub"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex-shrink:0"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            <span>GitHub</span>
          </button>
        </div>
      </section>

      <!-- Footer note -->
      <footer class="footer-note">
        <p>感谢你的访问，欢迎随时交流~</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.about-page {
  min-height: calc(100vh - 80px);
  padding: 9rem 1.5rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.about-container {
  max-width: 36rem;
  width: 100%;
  text-align: center;
}

.intro-section {
  margin-bottom: 3rem;
}

.greeting {
  font-family: 'Noto Serif SC', serif;
  font-size: 2rem;
  font-weight: 900;
  color: #1F1F1C;
  margin-bottom: 1rem;
}

html.dark .greeting {
  color: #f4f6fa;
}

.bio {
  font-size: 1.1rem;
  color: #6a6863;
  line-height: 1.7;
  margin-bottom: 1.5rem;
}

html.dark .bio {
  color: #a6afbf;
}

.location {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  color: #7A766F;
}

html.dark .location {
  color: #7A766F;
}

.contact-section {
  margin-bottom: 3rem;
}

.section-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #475671;
  margin-bottom: 1.5rem;
}

html.dark .section-title {
  color: #a6b9d4;
}

.contact-links {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.contact-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
}

.email-btn {
  background: #111111;
  color: #ffffff;
}

html.dark .email-btn {
  background: #ffffff;
  color: #111111;
}

.email-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

html.dark .email-btn:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.github-btn {
  background: rgba(95, 110, 138, 0.15);
  color: #475671;
}

html.dark .github-btn {
  background: rgba(95, 110, 138, 0.25);
  color: #f4f6fa;
}

.github-btn:hover {
  background: rgba(95, 110, 138, 0.25);
  transform: translateY(-2px);
}

.footer-note {
  padding-top: 2rem;
  border-top: 1px solid rgba(214, 209, 201, 0.3);
}

html.dark .footer-note {
  border-top-color: rgba(255, 255, 255, 0.1);
}

.footer-note p {
  font-size: 0.9375rem;
  color: #7A766F;
}

html.dark .footer-note p {
  color: #7A766F;
}

@media (min-width: 768px) {
  .about-page {
    padding: 8rem 2rem 1rem;
  }

  .greeting {
    font-size: 2.5rem;
  }
}
</style>
