# Tailwind CSS — Quick Reference for BrainFlow

## Installation (Vite + React)

```bash
npm install -D tailwindcss @tailwindcss/vite
```

In `vite.config.ts`:
```typescript
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss()],
})
```

In your main CSS file:
```css
@import "tailwindcss";
```

## Node Styling Patterns

### Mind Map Node Card
```tsx
<div className="rounded-xl border-2 border-blue-200 bg-white p-4 shadow-lg 
               hover:shadow-xl transition-all duration-200 min-w-[200px] max-w-[280px]">
  <span className="text-xs font-medium uppercase tracking-wide text-blue-600">idea</span>
  <h3 className="mt-1 text-sm font-semibold text-gray-900">Smart Invoicing</h3>
  <p className="mt-1 text-xs text-gray-500">Auto-detect billable hours</p>
</div>
```

### Node Type Colors
```tsx
const nodeTypeStyles = {
  idea:      'border-blue-300 bg-blue-50',
  detail:    'border-gray-300 bg-gray-50',
  question:  'border-purple-300 bg-purple-50',
  challenge: 'border-red-300 bg-red-50',
  action:    'border-green-300 bg-green-50',
};
```

### Streaming/Ghost Node (Placeholder)
```tsx
<div className="animate-pulse rounded-xl border-2 border-dashed border-blue-300 
               bg-blue-50/50 p-4 min-w-[200px]">
  <div className="h-3 w-16 rounded bg-blue-200"></div>
  <div className="mt-2 h-4 w-32 rounded bg-blue-200"></div>
</div>
```

### Selected Node
```tsx
<div className="ring-2 ring-blue-500 ring-offset-2 rounded-xl ...">
```

## Animations

### Fade In (New Node)
```css
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
```

Or use Tailwind's built-in:
```tsx
<div className="animate-in fade-in duration-300">
```

### Pulse (Thinking/Loading)
```tsx
<div className="animate-pulse">...</div>
```

### Spin (Status indicator)
```tsx
<div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
```

## Layout Patterns

### Full-Screen Canvas Container
```tsx
<div className="h-screen w-screen relative overflow-hidden bg-gray-50">
  {/* React Flow canvas */}
</div>
```

### Bottom Input Bar
```tsx
<div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 
               w-full max-w-2xl px-4">
  <div className="flex items-center gap-2 rounded-2xl bg-white 
                  border border-gray-200 shadow-xl px-4 py-3">
    <input className="flex-1 outline-none text-sm" placeholder="What should we brainstorm?" />
    <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
      Go
    </button>
  </div>
</div>
```

### Action Bar (Floating)
```tsx
<div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
  <button className="rounded-lg bg-white border px-3 py-2 text-sm shadow-sm 
                     hover:bg-gray-50 transition">
    Expand
  </button>
  <button className="rounded-lg bg-white border px-3 py-2 text-sm shadow-sm 
                     hover:bg-red-50 text-red-600 transition">
    Challenge
  </button>
</div>
```

### Agent Status Panel
```tsx
<div className="absolute top-4 left-4 z-10 max-w-sm">
  <div className="rounded-lg bg-white/90 backdrop-blur border px-4 py-3 shadow-sm">
    <div className="flex items-center gap-2">
      <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full" />
      <span className="text-xs text-gray-600">Agent is thinking...</span>
    </div>
    <p className="mt-1 text-xs text-gray-500 italic">
      "Exploring key pain points for freelancers..."
    </p>
  </div>
</div>
```

### Mode Selector
```tsx
<select className="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm">
  <option value="brainstorm">🧠 Brainstorm</option>
  <option value="architect">🏗️ Architect</option>
  <option value="critic">⚔️ Critic</option>
  <option value="researcher">🔬 Researcher</option>
</select>
```

## Useful Utility Classes

| Pattern | Classes |
|---------|---------|
| Truncate text | `truncate` |
| Line clamp | `line-clamp-2` |
| Glass effect | `bg-white/80 backdrop-blur-sm` |
| Smooth transitions | `transition-all duration-200` |
| Focus ring | `focus:ring-2 focus:ring-blue-500 focus:outline-none` |
| Responsive text | `text-xs sm:text-sm` |
| Absolute center | `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2` |
