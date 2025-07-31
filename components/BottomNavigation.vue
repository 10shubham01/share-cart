<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed, ref, watch } from 'vue'

const route = useRoute()
const router = useRouter()

const navigationItems = [
    { to: '/', icon: 'i-lucide-home', label: 'Home' },
    { to: '/groceries', icon: 'i-lucide-shopping-basket', label: 'Groceries' },
    { to: '/friends', icon: 'i-lucide-users', label: 'Friends' }
]

const getIndexFromRoute = () => navigationItems.findIndex(item => item.to === route.path)
const activeIdx = ref(getIndexFromRoute())

function goTo(idx: number) {
    activeIdx.value = idx
    router.push(navigationItems[idx].to)
}

watch(() => route.path, (newPath) => {
    const idx = navigationItems.findIndex(item => item.to === newPath)
    if (idx !== -1) activeIdx.value = idx
})

const itemCount = navigationItems.length

const indicatorStyle = computed(() => {
    const idx = activeIdx.value ?? 0
    return {
        width: `calc(100% / ${itemCount})`,
        transform: `translateX(${idx * 100}%)`
    }
})
</script>

<template>
    <div class="navigation">
        <ul class="listWrap">
            <li v-for="(item, idx) in navigationItems" :key="item.to" :class="['list', { active: activeIdx === idx }]"
                @click="goTo(idx)" :style="{ width: `calc(100% / ${itemCount})` }">
                <a href="javascript:void(0);">
                    <i class="icon">
                        <UIcon :name="item.icon" class="w-6 h-6" />
                    </i>
                    <span class="text font-bold">{{ item.label }}</span>
                </a>
            </li>
            <li class="indicator" :style="indicatorStyle"></li>
        </ul>
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500&display=swap');

.navigation {
    width: 100%;
    max-width: 400px;
    height: 70px;
    background: var(--ui-color-primary-500);

    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 10px 10px 0 0;
    padding: 0 20px;
    z-index: 50;
}

.listWrap {
    list-style: none;
    display: flex;
    justify-content: space-between;
    width: 100%;
    position: relative;
}

.list {
    width: 70px;
    height: 70px;
    position: relative;
    z-index: 1;
}

.list a {
    text-decoration: none;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    text-align: center;
    font-weight: 500;
    width: 100%;
    height: 100%;
}

.list a:hover {
    text-decoration: none;
}

.icon {
    position: relative;
    display: block;
    line-height: 75px;
    text-align: center;
    transition: 0.5s;
    color: #fff;
}

.text {
    position: absolute;
    color: #fff;
    font-weight: 600;
    letter-spacing: 0.05em;
    transition: 0.5s;
    transform: translateY(20px);
    opacity: 0;
    z-index: 1;
    font-size: 12px;
}

.list.active a .icon {
    color: #fff;
    transform: translateY(-32px);
}

.list.active a .text {
    opacity: 1;
    transform: translateY(10px);
}

.indicator {
    position: absolute;
    width: 70px;
    height: 70px;
    top: -50%;
    border-radius: 50%;
    border: 6px solid #fff;
    background: var(--ui-color-primary-500);
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 0;
}

.indicator::before,
.indicator::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 20px;
    height: 20px;
    background: transparent;
}

.indicator::after {
    right: -22px;
    box-shadow: -1px -10px 0 0 #fff;
    border-top-left-radius: 20px;
}

.indicator::before {
    left: -22px;
    box-shadow: 1px -10px 0 0 #fff;
    border-top-right-radius: 20px;
}
</style>