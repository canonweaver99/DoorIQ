# Logging System Documentation

## Overview

DoorIQ now uses a centralized, environment-aware logging system that only shows detailed logs in development while keeping production logs clean and focused on errors/warnings.

## Logger Utility

Location: `/lib/logger.ts`

The logger automatically detects the environment and adjusts its output accordingly:
- **Development**: All logs are shown with emoji prefixes for easy identification
- **Production**: Only errors and warnings are logged to reduce noise

## Available Log Methods

### `logger.debug(message, data?)`
Only shown in development. Use for detailed debugging information.
```typescript
logger.debug('User data fetched', { userId: '123', role: 'manager' })
```

### `logger.info(message, data?)`
Only shown in development. Use for general information.
```typescript
logger.info('Session started', { sessionId, agentId })
```

### `logger.success(message, data?)`
Only shown in development. Use for successful operations.
```typescript
logger.success('Grading completed', { score: 85, duration: '12.5s' })
```

### `logger.warn(message, data?)`
⚠️ Shown in ALL environments. Use for non-critical issues.
```typescript
logger.warn('Large transcript detected', { lines: 1500 })
```

### `logger.error(message, error?, data?)`
❌ Shown in ALL environments. Use for errors and exceptions.
```typescript
logger.error('Failed to fetch session', error, { sessionId })
```

### `logger.perf(message, durationMs, data?)`
Only shown in development. Use for timing operations.
```typescript
const timer = logger.startTimer()
// ... do work ...
logger.perf('Database query completed', timer())
```

### `logger.api(message, data?)`
Only shown in development. Use for API request/response tracking.
```typescript
logger.api('Calling OpenAI API', { model: 'gpt-4', tokens: 1000 })
```

### `logger.db(message, data?)`
Only shown in development. Use for database operations.
```typescript
logger.db('Team config cached', { teamId, expiresIn: '5m' })
```

### `logger.group(label, callback)`
Groups related logs together (only in development).
```typescript
logger.group('Grading Complete', () => {
  logger.success('Score calculated', { score: 85 })
  logger.info('Performance stats', { duration: '12s' })
})
```

### `logger.startTimer()`
Returns a function that calculates elapsed time.
```typescript
const timer = logger.startTimer()
await doSomething()
const elapsed = timer() // Returns time in milliseconds
logger.perf('Operation completed', elapsed)
```

## Files Updated

The following files have been updated to use the new logging system:

### 1. **Header Component**
- File: `/components/navigation/Header.tsx`
- Replaced: Debug logs for user authentication and avatar updates
- Now uses: `logger.debug()`, `logger.success()`, `logger.warn()`, `logger.info()`

### 2. **Grading API Route**
- File: `/app/api/grade/session/route.ts`
- Replaced: Extensive console.logs throughout the grading process
- Now uses: All logger methods including `logger.group()` and `logger.perf()`
- Performance tracking is now cleaner and only shown in development

### 3. **ElevenLabs API Route**
- File: `/app/api/eleven/signed-url/route.ts`
- Replaced: API request/response logging
- Now uses: `logger.api()`, `logger.error()`, `logger.success()`

### 4. **Trainer Page**
- File: `/app/trainer/page.tsx`
- Replaced: Error logging for audio playback and session management
- Now uses: `logger.error()`, `logger.warn()`

## Migration Guide

### Before (Old)
```typescript
console.log('🔍 User found:', user)
console.error('❌ Failed to fetch:', error)
console.warn('⚠️ Large file detected:', size)
```

### After (New)
```typescript
logger.debug('User found', { user })
logger.error('Failed to fetch', error)
logger.warn('Large file detected', { size })
```

## Benefits

1. **Environment-Aware**: Development logs don't clutter production
2. **Structured Data**: Pass objects instead of string concatenation
3. **Type-Safe**: Full TypeScript support
4. **Consistent**: Same emoji prefixes throughout the app
5. **Performance**: Logs are skipped entirely in production (not just hidden)
6. **Debugging**: Easy to spot different log types by emoji
7. **Production-Ready**: Clean console in production with only critical messages

## Best Practices

### DO ✅
- Use `logger.error()` for all exceptions and failures
- Use `logger.warn()` for recoverable issues
- Pass structured data objects for context
- Use `logger.perf()` for timing critical operations
- Use `logger.group()` for related operations

### DON'T ❌
- Don't use `console.log()` directly anymore
- Don't log sensitive data (passwords, API keys, tokens)
- Don't use `logger.info()` or `logger.debug()` for critical production issues
- Don't concatenate strings - pass data as objects instead

## Example: Complete Error Handling

```typescript
try {
  const timer = logger.startTimer()
  logger.info('Starting session grading', { sessionId })
  
  const result = await gradeSession(sessionId)
  logger.perf('Grading completed', timer(), { score: result.score })
  
  return result
} catch (error) {
  logger.error('Failed to grade session', error, { sessionId })
  throw error
}
```

## Next Steps

Consider adding in the future:
- Remote logging service integration (Sentry, LogRocket, etc.)
- Log levels via environment variables
- File-based logging for production
- Request ID tracking for API routes

