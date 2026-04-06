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
          <span class="material-symbols-outlined">location_on</span>
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
            <span class="material-symbols-outlined">mail</span>
            <span>发送邮件</span>
          </button>

          <button
            v-if="author.github"
            class="contact-btn github-btn"
            @click="openGitHub"
          >
            <span class="material-symbols-outlined">code</span>
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

.avatar-section {
  margin-bottom: 2rem;
}

.avatar-wrapper {
  width: 120px;
  height: 120px;
  margin: 0 auto;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba(95, 110, 138, 0.3);
  background: rgba(255, 255, 255, 0.8);
}

html.dark .avatar-wrapper {
  border-color: rgba(95, 110, 138, 0.5);
  background: rgba(30, 45, 70, 0.8);
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #5F6E8A;
  color: white;
  font-family: 'Noto Serif SC', serif;
  font-size: 3rem;
  font-weight: 700;
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

.location .material-symbols-outlined {
  font-size: 18px;
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

.contact-btn .material-symbols-outlined {
  font-size: 20px;
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

  .avatar-wrapper {
    width: 140px;
    height: 140px;
  }
}
</style>
