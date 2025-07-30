<script lang="ts" setup>
import type { Database } from '~/types/database.types';

type Friend = Database['public']['Tables']['friends']['Row'] & {
  friend?: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
};

type FriendRequest = Database['public']['Tables']['friend_requests']['Row'] & {
  from_user?: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  to_user?: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
};

const { user } = useAuth();
const toast = useToast();

// Redirect to login if not authenticated
onMounted(() => {
  if (!user.value) {
    navigateTo('/login');
  }
});

// Reactive data
const friends = ref<Friend[]>([]);
const filteredFriends = ref<Friend[]>([]);
const friendRequests = ref<FriendRequest[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const showAddFriendModal = ref(false);
const selectedFriends = ref<string[]>([]);
const viewMode = ref<'grid' | 'list'>('grid');
const isEditMode = ref(false);
const searchQuery = ref('');
const activeTab = ref<'friends' | 'requests'>('friends');
const newFriendEmail = ref('');
const newFriendMessage = ref('');
const addingFriend = ref(false);
const processingRequest = ref<string | null>(null);

// Computed properties
const displayFriends = computed(() => {
  if (searchQuery.value.trim()) {
    return filteredFriends.value;
  }
  return friends.value;
});

const pendingRequests = computed(() => {
  return friendRequests.value.filter(req => req.status === 'pending');
});

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Get friend name
const getFriendName = (friend: Friend) => {
  if (friend.friend?.full_name) {
    return friend.friend.full_name;
  }
  if (friend.friend?.email) {
    return friend.friend.email.split('@')[0];
  }
  // If we have the friend_id, show a shortened version
  if (friend.friend_id) {
    return `User ${friend.friend_id.slice(0, 8)}`;
  }
  return 'Unknown User';
};

// Get request user name
const getRequestUserName = (request: FriendRequest) => {
  const userData = request.from_user_id === user.value?.id ? request.to_user : request.from_user;
  if (userData?.full_name) {
    return userData.full_name;
  }
  if (userData?.email) {
    return userData.email.split('@')[0];
  }
  // If we have the user ID, show a shortened version
  const userId = request.from_user_id === user.value?.id ? request.to_user_id : request.from_user_id;
  if (userId) {
    return `User ${userId.slice(0, 8)}`;
  }
  return 'Unknown User';
};

// Get request user email
const getRequestUserEmail = (request: FriendRequest) => {
  const userData = request.from_user_id === user.value?.id ? request.to_user : request.from_user;
  if (userData?.email) {
    return userData.email;
  }
  // If we have the user ID, show a placeholder
  const userId = request.from_user_id === user.value?.id ? request.to_user_id : request.from_user_id;
  if (userId) {
    return `user-${userId.slice(0, 8)}@example.com`;
  }
  return 'unknown@example.com';
};

// Get request status color
const getRequestStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'accepted':
      return 'success';
    case 'rejected':
      return 'error';
    case 'cancelled':
      return 'neutral';
    default:
      return 'neutral';
  }
};

// Search functionality
const performSearch = () => {
  if (!searchQuery.value.trim()) {
    filteredFriends.value = friends.value;
    return;
  }

  const query = searchQuery.value.toLowerCase().trim();
  filteredFriends.value = friends.value.filter(friend =>
    getFriendName(friend).toLowerCase().includes(query) ||
    friend.friend?.email?.toLowerCase().includes(query)
  );
};

// Fetch friends
const fetchFriends = async () => {
  if (!user.value) return;

  loading.value = true;
  error.value = null;

  try {
    const { data, error: fetchError } = await useFetch('/api/friends');

    if (fetchError.value) {
      throw new Error(fetchError.value.message);
    }

    if (data.value) {
      friends.value = data.value;
      filteredFriends.value = data.value;
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load friends';
    toast.add({
      title: 'Error',
      description: error.value || 'Failed to load friends',
      color: 'error'
    });
  } finally {
    loading.value = false;
  }
};

// Fetch friend requests
const fetchFriendRequests = async () => {
  if (!user.value) return;

  try {
    const { data, error: fetchError } = await useFetch('/api/friend-requests');

    if (fetchError.value) {
      throw new Error(fetchError.value.message);
    }

    if (data.value) {
      friendRequests.value = data.value;
    }
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.message || 'Failed to load friend requests',
      color: 'error'
    });
  }
};

// Toggle selection
const toggleSelection = (friendId: string) => {
  if (!isEditMode.value) return;

  const index = selectedFriends.value.indexOf(friendId);
  if (index > -1) {
    selectedFriends.value.splice(index, 1);
  } else {
    selectedFriends.value.push(friendId);
  }
};

// Toggle edit mode
const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value;
  if (isEditMode.value) {
    selectedFriends.value = [];
  }
};

// Add friend
const addFriend = async () => {
  if (!newFriendEmail.value.trim()) {
    toast.add({
      title: 'Error',
      description: 'Friend email is required',
      color: 'error'
    });
    return;
  }

  addingFriend.value = true;

  try {
    // First, find the user by email
    const { data: users, error: userError } = await useFetch('/api/users/search', {
      method: 'POST',
      body: { email: newFriendEmail.value }
    });

    if (userError.value) {
      throw new Error(userError.value.message);
    }

    if (!users.value || (Array.isArray(users.value) && users.value.length === 0)) {
      throw new Error('User not found with this email address');
    }

    const friendUser = users.value[0];

    // Send friend request
    const { data, error: requestError } = await useFetch('/api/friends', {
      method: 'POST',
      body: {
        friend_id: friendUser.id,
        message: newFriendMessage.value || null
      }
    });

    if (requestError.value) {
      throw new Error(requestError.value.message);
    }

    toast.add({
      title: 'Success',
      description: 'Friend request sent successfully!',
      color: 'success'
    });

    closeAddFriendModal();
    await fetchFriendRequests();
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.message || 'Failed to send friend request',
      color: 'error'
    });
  } finally {
    addingFriend.value = false;
  }
};

// Handle friend request
const handleFriendRequest = async (requestId: string, action: 'accept' | 'reject' | 'cancel') => {
  processingRequest.value = requestId;

  try {
    const { data, error } = await useFetch('/api/friend-requests', {
      method: 'POST',
      body: {
        request_id: requestId,
        action
      }
    });

    if (error.value) {
      throw new Error(error.value.message);
    }

    const actionText = action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'cancelled';
    toast.add({
      title: 'Success',
      description: `Friend request ${actionText} successfully!`,
      color: 'success'
    });

    await fetchFriendRequests();
    if (action === 'accept') {
      await fetchFriends();
    }
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.message || 'Failed to process friend request',
      color: 'error'
    });
  } finally {
    processingRequest.value = null;
  }
};

// Remove friend
const removeFriend = async (friendId: string) => {
  const friend = friends.value.find(f => f.id === friendId);
  if (!friend) return;

  if (!confirm(`Are you sure you want to remove "${getFriendName(friend)}" from your friends?`)) {
    return;
  }

  try {
    const { error: deleteError } = await useFetch(`/api/friends/${friendId}`, {
      method: 'DELETE'
    });

    if (deleteError.value) {
      throw new Error(deleteError.value.message);
    }

    friends.value = friends.value.filter(f => f.id !== friendId);
    selectedFriends.value = selectedFriends.value.filter(id => id !== friendId);

    toast.add({
      title: 'Success',
      description: 'Friend removed successfully!',
      color: 'success'
    });
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.message || 'Failed to remove friend',
      color: 'error'
    });
  }
};

// Close add friend modal
const closeAddFriendModal = () => {
  showAddFriendModal.value = false;
  newFriendEmail.value = '';
  newFriendMessage.value = '';
};

// Watch for search query changes
watch(searchQuery, () => {
  performSearch();
});

// Initialize
onMounted(async () => {
  await fetchFriends();
  await fetchFriendRequests();
});
</script>

<template>
  <div class="relative">
    <!-- Sticky Header -->
    <div
      class="sticky top-0 z-50 bg-gradient-to-r from-white via-white to-primary-50/30 backdrop-blur-md border-b border-gray-200/50 py-6 w-full shadow-sm">
      <div class="flex justify-between flex-col sm:flex-row px-4 max-w-7xl mx-auto">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-4">
            <div class="p-2 bg-primary-100 rounded-xl">
              <UIcon name="i-heroicons-user-group" class="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1
                class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-primary-700 bg-clip-text text-transparent">
                Friends
              </h1>
              <p class="text-gray-600 text-sm font-medium">Connect and manage your friends</p>
            </div>
          </div>

          <div class="relative max-w-md">
            <UInput v-model="searchQuery" placeholder="Search friends by name or email..."
              leading-icon="i-heroicons-magnifying-glass">
              <template #trailing>
                <UIcon v-if="searchQuery" name="i-heroicons-x-mark" @click="searchQuery = ''" />
              </template>
            </UInput>
          </div>
        </div>

        <div class="flex items-center gap-3 mt-4 sm:mt-0">
          <UButton color="primary" variant="solid" size="lg" @click="showAddFriendModal = true"
            icon="i-heroicons-user-plus"
            class="shadow-lg hover:shadow-xl transition-all duration-300 font-semibold px-6 rounded-xl hover:scale-105">
            Add Friend
          </UButton>

          <UButton :variant="isEditMode ? 'solid' : 'outline'" :color="isEditMode ? 'primary' : 'neutral'" size="lg"
            @click="toggleEditMode" icon="i-lucide-cog"
            class="shadow-md hover:shadow-lg transition-all duration-300 rounded-xl hover:scale-105">
            {{ isEditMode ? 'Done' : 'Manage' }}
          </UButton>

          <div
            class="flex items-center bg-white/80 backdrop-blur-sm rounded-xl p-1.5 shadow-lg border border-gray-200/50">
            <UButton :variant="viewMode === 'grid' ? 'solid' : 'ghost'"
              :color="viewMode === 'grid' ? 'primary' : 'neutral'" size="sm" @click="viewMode = 'grid'"
              class="rounded-lg transition-all duration-300 hover:scale-105">
              <UIcon name="i-heroicons-squares-2x2" class="h-4 w-4" />
            </UButton>
            <UButton :variant="viewMode === 'list' ? 'solid' : 'ghost'"
              :color="viewMode === 'list' ? 'primary' : 'neutral'" size="sm" @click="viewMode = 'list'"
              class="rounded-lg transition-all duration-300 hover:scale-105">
              <UIcon name="i-heroicons-list-bullet" class="h-4 w-4" />
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="px-4 pt-6">
      <div class="flex space-x-1 bg-gray-100 p-1 rounded-xl max-w-md">
        <UButton :variant="activeTab === 'friends' ? 'solid' : 'ghost'"
          :color="activeTab === 'friends' ? 'primary' : 'neutral'" size="sm" @click="activeTab = 'friends'"
          class="flex-1 rounded-lg transition-all duration-300">
          <UIcon name="i-heroicons-users" class="h-4 w-4 mr-2" />
          Friends
          <span v-if="friends.length > 0" class="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
            {{ friends.length }}
          </span>
        </UButton>
        <UButton :variant="activeTab === 'requests' ? 'solid' : 'ghost'"
          :color="activeTab === 'requests' ? 'primary' : 'neutral'" size="sm" @click="activeTab = 'requests'"
          class="flex-1 rounded-lg transition-all duration-300">
          <UIcon name="i-heroicons-bell" class="h-4 w-4 mr-2" />
          Requests
          <span v-if="pendingRequests.length > 0" class="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
            {{ pendingRequests.length }}
          </span>
        </UButton>
      </div>
    </div>

    <!-- Content -->
    <div class="pt-6">
      <!-- Friends Tab -->
      <div v-if="activeTab === 'friends'">
        <div v-if="loading" class="px-4">
          <div v-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div v-for="i in 6" :key="i"
              class="bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl animate-pulse shadow-lg h-64">
              <div class="h-full flex flex-col justify-center items-center p-6">
                <div class="w-16 h-16 bg-gray-400 rounded-full mb-4 animate-pulse"></div>
                <div class="w-32 h-5 bg-gray-400 rounded mb-3 animate-pulse"></div>
                <div class="w-24 h-4 bg-gray-400 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          <div v-else class="space-y-4">
            <div v-for="i in 4" :key="i"
              class="bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl p-6 animate-pulse shadow-lg">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="w-48 h-6 bg-gray-400 rounded mb-3 animate-pulse"></div>
                  <div class="w-32 h-4 bg-gray-400 rounded animate-pulse"></div>
                </div>
                <div class="w-20 h-8 bg-gray-400 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="displayFriends.length === 0" class="text-center py-12 px-4">
          <div v-if="searchQuery" class="space-y-4">
            <UIcon name="i-heroicons-magnifying-glass" class="h-16 w-16 text-gray-400 mx-auto" />
            <h3 class="text-xl font-semibold text-gray-900">No friends found</h3>
            <p class="text-gray-600">Try adjusting your search terms or browse all friends</p>
            <UButton @click="searchQuery = ''" color="primary" variant="outline">
              Clear Search
            </UButton>
          </div>
          <div v-else class="space-y-4">
            <UIcon name="i-heroicons-user-group" class="h-16 w-16 text-gray-400 mx-auto" />
            <h3 class="text-xl font-semibold text-gray-900">No Friends Yet</h3>
            <p class="text-gray-600">Add your first friend to start connecting</p>
            <UButton @click="showAddFriendModal = true" color="primary">
              <UIcon name="i-heroicons-user-plus" class="h-4 w-4 mr-2" />
              Add First Friend
            </UButton>
          </div>
        </div>

        <!-- Grid View -->
        <div v-else-if="viewMode === 'grid'"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4" v-auto-animate>
          <UCard v-for="friend in displayFriends" :key="friend.id" :class="[
            'bg-gradient-to-br from-white to-primary-50/20 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group relative overflow-hidden',
            selectedFriends.includes(friend.id) ? 'ring-2 ring-primary-500 shadow-primary-500/25' : ''
          ]" @click="toggleSelection(friend.id)">
            <!-- Background Pattern -->
            <div
              class="absolute inset-0 bg-gradient-to-br from-primary-100/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            </div>

            <div class="relative z-10">
              <!-- Header -->
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors duration-300">
                    <UIcon name="i-heroicons-user" class="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3
                      class="text-lg font-semibold text-gray-900 group-hover:text-primary-700 transition-colors duration-300">
                      {{ getFriendName(friend) }}
                    </h3>
                    <p class="text-xs text-gray-500">{{ friend.friend?.email }}</p>
                  </div>
                </div>

                <div v-if="isEditMode" class="flex gap-1">
                  <UButton size="xs" color="error" variant="solid" icon="i-heroicons-user-minus"
                    class="shadow-sm hover:shadow-md transition-shadow" @click.stop="removeFriend(friend.id)" />
                </div>
              </div>

              <!-- Stats -->
              <div class="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span class="flex items-center gap-1">
                  <UIcon name="i-heroicons-calendar" class="h-4 w-4" />
                  {{ formatDate(friend.created_at) }}
                </span>
                <span class="flex items-center gap-1">
                  <UIcon name="i-heroicons-calendar" class="h-4 w-4" />
                  Friends since {{ formatDate(friend.created_at) }}
                </span>
              </div>

              <!-- Actions -->
              <div class="flex gap-2">
                <UButton variant="outline" size="sm" block
                  class="group-hover:bg-primary-50 group-hover:border-primary-300 transition-all duration-300">
                  <UIcon name="i-heroicons-chat-bubble-left" class="h-4 w-4 mr-1" />
                  Message
                </UButton>
                <UButton variant="outline" size="sm" block
                  class="group-hover:bg-primary-50 group-hover:border-primary-300 transition-all duration-300">
                  <UIcon name="i-heroicons-share" class="h-4 w-4 mr-1" />
                  Share
                </UButton>
              </div>
            </div>
          </UCard>
        </div>

        <!-- List View -->
        <div v-else class="space-y-4 px-4" v-auto-animate>
          <UCard v-for="friend in displayFriends" :key="friend.id" :class="[
            'bg-gradient-to-r from-white to-primary-50/20 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group',
            selectedFriends.includes(friend.id) ? 'ring-2 ring-primary-500 shadow-primary-500/25' : ''
          ]" @click="toggleSelection(friend.id)">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="p-3 bg-primary-100 rounded-xl group-hover:bg-primary-200 transition-colors duration-300">
                  <UIcon name="i-heroicons-user" class="h-6 w-6 text-primary-600" />
                </div>

                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-1">
                    <h3
                      class="text-lg font-semibold text-gray-900 group-hover:text-primary-700 transition-colors duration-300">
                      {{ getFriendName(friend) }}
                    </h3>
                    <span class="text-xs text-gray-500">{{ formatDate(friend.created_at) }}</span>
                  </div>

                  <p class="text-sm text-gray-600 mb-2">{{ friend.friend?.email }}</p>

                  <div class="flex items-center gap-4 text-sm text-gray-500">
                    <span class="flex items-center gap-1">
                      <UIcon name="i-heroicons-calendar" class="h-4 w-4" />
                      Friends since {{ formatDate(friend.created_at) }}
                    </span>
                    <span class="flex items-center gap-1">
                      <UIcon name="i-heroicons-calendar" class="h-4 w-4" />
                      Friends since {{ formatDate(friend.created_at) }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <div v-if="isEditMode" class="flex gap-1">
                  <UButton size="sm" color="error" variant="solid" icon="i-heroicons-user-minus"
                    class="shadow-sm hover:shadow-md transition-shadow" @click.stop="removeFriend(friend.id)" />
                </div>

                <div class="flex gap-2">
                  <UButton variant="outline" size="sm"
                    class="group-hover:bg-primary-50 group-hover:border-primary-300 transition-all duration-300">
                    <UIcon name="i-heroicons-chat-bubble-left" class="h-4 w-4 mr-1" />
                    Message
                  </UButton>
                  <UButton variant="outline" size="sm"
                    class="group-hover:bg-primary-50 group-hover:border-primary-300 transition-all duration-300">
                    <UIcon name="i-heroicons-share" class="h-4 w-4 mr-1" />
                    Share
                  </UButton>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Friend Requests Tab -->
      <div v-else-if="activeTab === 'requests'" class="px-4">
        <div v-if="loading" class="space-y-4">
          <div v-for="i in 3" :key="i"
            class="bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl p-6 animate-pulse shadow-lg">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="w-48 h-6 bg-gray-400 rounded mb-3 animate-pulse"></div>
                <div class="w-32 h-4 bg-gray-400 rounded animate-pulse"></div>
              </div>
              <div class="w-32 h-8 bg-gray-400 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        <div v-else-if="friendRequests.length === 0" class="text-center py-12">
          <UIcon name="i-heroicons-bell" class="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-xl font-semibold text-gray-900 mb-2">No Friend Requests</h3>
          <p class="text-gray-600">You don't have any pending friend requests</p>
        </div>

        <div v-else class="space-y-4" v-auto-animate>
          <UCard v-for="request in friendRequests" :key="request.id"
            class="bg-gradient-to-r from-white to-primary-50/20 border border-gray-200/50 shadow-lg">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="p-3 bg-primary-100 rounded-xl">
                  <UIcon name="i-heroicons-user" class="h-6 w-6 text-primary-600" />
                </div>

                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-1">
                    <h3 class="text-lg font-semibold text-gray-900">
                      {{ getRequestUserName(request) }}
                    </h3>
                    <UBadge :color="getRequestStatusColor(request.status)" variant="soft" size="sm">
                      {{ request.status }}
                    </UBadge>
                  </div>

                  <p class="text-sm text-gray-600 mb-2">{{ getRequestUserEmail(request) }}</p>

                  <div class="flex items-center gap-4 text-sm text-gray-500">
                    <span class="flex items-center gap-1">
                      <UIcon name="i-heroicons-calendar" class="h-4 w-4" />
                      {{ formatDate(request.created_at) }}
                    </span>
                    <span v-if="request.message" class="flex items-center gap-1">
                      <UIcon name="i-heroicons-chat-bubble-left" class="h-4 w-4" />
                      "{{ request.message }}"
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex gap-2">
                <UButton v-if="request.status === 'pending' && request.to_user_id === user?.id" color="success"
                  variant="solid" size="sm" @click="handleFriendRequest(request.id, 'accept')"
                  :loading="processingRequest === request.id">
                  <UIcon name="i-heroicons-check" class="h-4 w-4 mr-1" />
                  Accept
                </UButton>
                <UButton v-if="request.status === 'pending' && request.to_user_id === user?.id" color="error"
                  variant="outline" size="sm" @click="handleFriendRequest(request.id, 'reject')"
                  :loading="processingRequest === request.id">
                  <UIcon name="i-heroicons-x-mark" class="h-4 w-4 mr-1" />
                  Reject
                </UButton>
                <UButton v-if="request.status === 'pending' && request.from_user_id === user?.id" color="error"
                  variant="outline" size="sm" @click="handleFriendRequest(request.id, 'cancel')"
                  :loading="processingRequest === request.id">
                  <UIcon name="i-heroicons-x-mark" class="h-4 w-4 mr-1" />
                  Cancel
                </UButton>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </div>

    <!-- Floating Action Button for Selected Friends -->
    <div v-if="selectedFriends.length > 0" class="fixed bottom-6 right-6 z-50">
      <UButton color="primary" size="xl" icon="i-heroicons-user-group" class="shadow-lg">
        <span class="font-medium">{{ selectedFriends.length }}</span>
      </UButton>
    </div>

    <!-- Add Friend Modal -->
    <UDrawer v-model:open="showAddFriendModal">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Add Friend</h3>
          <UButton icon="i-heroicons-x-mark" variant="ghost" size="sm" @click="closeAddFriendModal" />
        </div>
      </template>

      <template #body>
        <form @submit.prevent="addFriend" class="space-y-6">
          <UFormField label="Friend's Email" required>
            <UInput v-model="newFriendEmail" placeholder="Enter friend's email address" required type="email" />
          </UFormField>

          <UFormField label="Message (Optional)">
            <UTextarea v-model="newFriendMessage" placeholder="Add a personal message to your friend request"
              :rows="3" />
          </UFormField>

          <div class="flex justify-end gap-3 pt-4">
            <UButton variant="outline" @click="closeAddFriendModal">
              Cancel
            </UButton>
            <UButton color="primary" type="submit" :loading="addingFriend" :disabled="!newFriendEmail.trim()">
              Send Request
            </UButton>
          </div>
        </form>
      </template>
    </UDrawer>
  </div>
</template>