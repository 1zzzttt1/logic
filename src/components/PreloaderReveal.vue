<script setup lang="ts">
defineProps<{
  visible: boolean
}>()
</script>

<template>
  <template v-if="visible">
    <div class="preloader-progress">
      <div class="preloader-progress-bar"></div>

      <div class="preloader-logo">
        <h1>Logic</h1>
      </div>
    </div>

    <div class="preloader-mask"></div>

    <div class="preloader-content">
      <div class="preloader-footer">
        <p>清晰，从这里开始</p>
      </div>
    </div>
  </template>
</template>

<style scoped>
.preloader-progress,
.preloader-mask,
.preloader-content {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100svh;
  pointer-events: none;
}

.preloader-progress {
  background-color: var(--base-200);
  z-index: 9998;
  will-change: opacity;
}

.preloader-progress-bar {
  position: absolute;
  top: 0;
  left: 50%;
  width: 55%;
  height: 100%;
  background-color: var(--base-300);
  transform: translateX(-50%) scaleX(0);
  transform-origin: left center;
  will-change: transform;
}

.preloader-logo {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  text-align: center;
  mix-blend-mode: difference;
  z-index: 9999;
}

.preloader-logo h1 {
  position: relative;
  color: var(--base-300);
  font-size: 4.5rem;
  font-weight: 500;

  /* 关键：默认先隐藏，防止开屏闪现 */
  opacity: 0;
  visibility: hidden;
  will-change: transform, opacity;
}

.preloader-mask {
  background-color: var(--base-100);
  -webkit-mask: linear-gradient(var(--base-300), var(--base-300)),
    url('@/assets/mask.svg') center/50% no-repeat;
  -webkit-mask-composite: subtract;
  mask: linear-gradient(var(--base-300), var(--base-300)),
    url('@/assets/mask.svg') center/50% no-repeat;
  mask-composite: subtract;
  will-change: transform, opacity;
  z-index: 9998;
}

.preloader-content {
  z-index: 9999;
}

.preloader-footer {
  position: absolute;
  bottom: 4rem;
  left: 50%;
  transform: translateX(-50%);
  width: 50%;
  text-align: center;
}

.preloader-footer p {
  font-size: 1.5rem;
  color: var(--base-300);
  opacity: 0;
  visibility: hidden;
  will-change: transform, opacity;
}

.line,
.char {
  position: relative;
  padding-bottom: 0.2em;
  margin-bottom: -0.2em;
  will-change: transform;
}

@media (max-width: 767px) {
  .preloader-logo h1 {
    font-size: 2rem;
  }

  .preloader-footer p {
    font-size: 1rem;
  }
}
</style>