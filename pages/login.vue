<script setup lang="ts">
const toast = useToast()
const loading = ref(false)
const isSignUp = ref(false)
const form = ref({
  email: '',
  password: '',
  username: '',
  fullName: ''
})

const { signIn, signUp, signInWithGoogle } = useAuth()

const handleSubmit = async () => {
  loading.value = true

  try {
    if (isSignUp.value) {
      await signUp(form.value)
      toast.add({ title: 'Success', description: 'Account created successfully!', color: 'success' })
    } else {
      await signIn(form.value)
      toast.add({ title: 'Success', description: 'Logged in successfully!', color: 'success' })
    }

    await navigateTo('/groceries')
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Authentication failed',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const handleGoogleSignIn = async () => {
  loading.value = true

  try {
    await signInWithGoogle()
  } catch (error: any) {
    loading.value = false
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to initiate Google sign-in',
      color: 'error'
    })
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900">
            {{ isSignUp ? 'Create Account' : 'Welcome Back' }}
          </h1>
          <p class="text-gray-600 mt-2">
            {{ isSignUp ? 'Join us to start tracking your group expense' : 'Sign in to your account' }}
          </p>
        </div>
      </template>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <UFormField v-if="isSignUp" label="Full Name">
          <UInput v-model="form.fullName" placeholder="Enter your full name" icon="i-lucide-user" required />
        </UFormField>

        <UFormField v-if="isSignUp" label="Username">
          <UInput v-model="form.username" placeholder="Choose a username" icon="i-lucide-at-sign" required />
        </UFormField>

        <UFormField label="Email">
          <UInput v-model="form.email" type="email" placeholder="Enter your email" icon="i-lucide-mail" required />
        </UFormField>

        <UFormField label="Password">
          <UInput v-model="form.password" type="password" placeholder="Enter your password" icon="i-lucide-lock"
            required />
        </UFormField>

        <UButton type="submit" block :loading="loading" :disabled="loading">
          {{ isSignUp ? 'Create Account' : 'Sign In' }}
        </UButton>
      </form>

      <div class="border-t border-gray-200 my-6"></div>

      <UButton block variant="outline" :loading="loading" :disabled="loading" @click="handleGoogleSignIn">
        <UIcon name="i-simple-icons-google" class="w-5 h-5 mr-2" />
        Continue with Google
      </UButton>

      <template #footer>
        <div class="text-center">
          <p class="text-sm text-gray-600">
            {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
            <UButton variant="link" size="sm" @click="isSignUp = !isSignUp">
              {{ isSignUp ? 'Sign In' : 'Sign Up' }}
            </UButton>
          </p>
        </div>
      </template>
    </UCard>
  </div>
</template>
