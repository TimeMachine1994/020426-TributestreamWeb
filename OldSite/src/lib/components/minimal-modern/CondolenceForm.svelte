<script lang="ts">
  import { getTheme, type ThemeKey } from '$lib/design-tokens/minimal-modern-theme';
  import Button from './Button.svelte';
  import Input from './Input.svelte';
  import Toast from './Toast.svelte';
  
  interface Props {
    theme?: ThemeKey;
    memorialId?: string;
    class?: string;
    onSubmit?: (condolence: CondolenceData) => Promise<void>;
  }
  
  interface CondolenceData {
    name: string;
    email?: string;
    relationship?: string;
    message: string;
    isPublic: boolean;
  }
  
  let {
    theme = 'minimal',
    memorialId,
    class: className = '',
    onSubmit
  }: Props = $props();
  
  const themeConfig = getTheme(theme);
  
  let formData = $state({
    name: '',
    email: '',
    relationship: '',
    message: '',
    isPublic: true
  });
  
  let isSubmitting = $state(false);
  let showSuccess = $state(false);
  let error = $state('');
  
  const relationships = [
    'Family Member',
    'Friend',
    'Colleague',
    'Neighbor',
    'Classmate',
    'Other'
  ];
  
  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    
    if (!formData.name.trim() || !formData.message.trim()) {
      error = 'Please fill in your name and message';
      return;
    }
    
    isSubmitting = true;
    error = '';
    
    try {
      const condolenceData: CondolenceData = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        relationship: formData.relationship || undefined,
        message: formData.message.trim(),
        isPublic: formData.isPublic
      };
      
      if (onSubmit) {
        await onSubmit(condolenceData);
      }
      
      // Reset form
      formData = {
        name: '',
        email: '',
        relationship: '',
        message: '',
        isPublic: true
      };
      
      showSuccess = true;
      setTimeout(() => showSuccess = false, 5000);
      
    } catch (err: any) {
      error = err.message || 'Failed to submit condolence. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="{themeConfig.card} p-6 {className}">
  <div class="mb-6">
    <h3 class="text-xl font-semibold {themeConfig.text} mb-2" style="font-family: {themeConfig.font.heading}">
      Share a Memory or Condolence
    </h3>
    <p class="text-sm {themeConfig.hero.sub}">
      Your words of comfort and shared memories mean so much to the family during this difficult time.
    </p>
  </div>

  {#if showSuccess}
    <Toast 
      theme={theme} 
      message="Thank you for sharing your condolence. Your message has been posted." 
      type="success" 
      class="mb-6"
    />
  {/if}

  {#if error}
    <Toast 
      theme={theme} 
      message={error} 
      type="error" 
      class="mb-6"
    />
  {/if}

  <form onsubmit={handleSubmit} class="space-y-4">
    <!-- Name and Email Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="name" class="block text-sm font-medium {themeConfig.text} mb-1">
          Your Name *
        </label>
        <Input
          id="name"
          type="text"
          bind:value={formData.name}
          required
          placeholder="Enter your full name"
          theme={theme}
        />
      </div>
      
      <div>
        <label for="email" class="block text-sm font-medium {themeConfig.text} mb-1">
          Email (optional)
        </label>
        <Input
          id="email"
          type="email"
          bind:value={formData.email}
          placeholder="your@email.com"
          theme={theme}
        />
      </div>
    </div>

    <!-- Relationship -->
    <div>
      <label for="relationship" class="block text-sm font-medium {themeConfig.text} mb-1">
        Your Relationship (optional)
      </label>
      <select 
        id="relationship"
        bind:value={formData.relationship}
        class="{themeConfig.input}"
      >
        <option value="">Select relationship</option>
        {#each relationships as relationship}
          <option value={relationship}>{relationship}</option>
        {/each}
      </select>
    </div>

    <!-- Message -->
    <div>
      <label for="message" class="block text-sm font-medium {themeConfig.text} mb-1">
        Your Message *
      </label>
      <textarea
        id="message"
        bind:value={formData.message}
        required
        rows="4"
        class="{themeConfig.input} resize-vertical"
        placeholder="Share a memory, express your condolences, or offer words of comfort..."
      ></textarea>
    </div>

    <!-- Privacy Option -->
    <div class="flex items-start gap-3">
      <input
        id="isPublic"
        type="checkbox"
        bind:checked={formData.isPublic}
        class="mt-1 h-4 w-4 rounded border-slate-300 text-[#D5BA7F] focus:ring-[#D5BA7F]"
      />
      <div>
        <label for="isPublic" class="text-sm font-medium {themeConfig.text}">
          Share publicly on memorial page
        </label>
        <p class="text-xs {themeConfig.hero.sub} mt-1">
          Uncheck this if you'd like your message to be private and only visible to the family.
        </p>
      </div>
    </div>

    <!-- Submit Button -->
    <div class="pt-2">
      <Button
        type="submit"
        theme={theme}
        disabled={isSubmitting}
        class="w-full"
      >
        {isSubmitting ? 'Posting Message...' : 'Post Message'}
      </Button>
    </div>
  </form>

  <!-- Guidelines -->
  <div class="mt-6 pt-4 border-t {themeConfig.footer.border}">
    <p class="text-xs {themeConfig.hero.sub}">
      Please keep messages respectful and appropriate. All public messages are moderated before appearing on the memorial page.
    </p>
  </div>
</div>
