# Match Debugging Guide

## Common Issues Why Matches Don't Show Up

### 1. **User Document Issues**
- **Missing matches array**: User document doesn't have a `matches` field
- **Empty matches array**: User has `matches: []` instead of actual match IDs
- **Corrupted user document**: User document exists but is missing required fields

### 2. **Match Document Issues**
- **Match document doesn't exist**: Match ID exists in user's matches array but match document is missing
- **Corrupted match document**: Match document exists but is missing `users` array or has wrong format
- **Orphaned matches**: Match exists in database but not in user's matches array

### 3. **Other User Issues**
- **Other user document missing**: Match exists but other user's document is deleted
- **Other user doesn't have match**: Match exists but other user doesn't have it in their matches array
- **User ID mismatch**: Match has wrong user IDs

### 4. **Data Consistency Issues**
- **Partial updates**: Match created but not added to both users' matches arrays
- **Failed updates**: Match document created but user document updates failed
- **Race conditions**: Concurrent operations causing data inconsistency

### 5. **Firestore Rules Issues**
- **Permission denied**: User can't read match documents due to security rules
- **Query limitations**: Firestore rules preventing certain queries

## Debugging Steps

### Step 1: Check User Document
```javascript
// In browser console
const userRef = doc(db, 'users', 'USER_ID');
const userDoc = await getDoc(userRef);
console.log('User data:', userDoc.data());
```

### Step 2: Check Matches Array
```javascript
const userData = userDoc.data();
console.log('Matches array:', userData.matches);
console.log('Number of matches:', userData.matches?.length || 0);
```

### Step 3: Check Each Match Document
```javascript
for (const matchId of userData.matches) {
  const matchRef = doc(db, 'matches', matchId);
  const matchDoc = await getDoc(matchRef);
  console.log(`Match ${matchId}:`, matchDoc.exists() ? matchDoc.data() : 'NOT FOUND');
}
```

### Step 4: Check Other Users
```javascript
// For each match, check the other user
const otherUserId = matchData.users.find(id => id !== 'CURRENT_USER_ID');
const otherUserRef = doc(db, 'users', otherUserId);
const otherUserDoc = await getDoc(otherUserRef);
console.log('Other user exists:', otherUserDoc.exists());
```

## Common Fixes

### Fix 1: Rebuild Matches Array
If user has orphaned matches, rebuild their matches array:
```javascript
// Get all matches where user is a participant
const matchesRef = collection(db, 'matches');
const userMatchesQuery = query(matchesRef, where('users', 'array-contains', 'USER_ID'));
const userMatchesSnapshot = await getDocs(userMatchesQuery);

const matchIds = userMatchesSnapshot.docs.map(doc => doc.id);
await updateDoc(userRef, { matches: matchIds });
```

### Fix 2: Fix Match Document
If match document is corrupted:
```javascript
// Recreate match document with correct structure
await setDoc(matchRef, {
  users: [userId1, userId2],
  createdAt: new Date()
});
```

### Fix 3: Fix User Document
If user document is missing matches array:
```javascript
await updateDoc(userRef, { matches: [] });
```

## Prevention

1. **Use transactions** for match creation to ensure atomicity
2. **Add error handling** for all Firestore operations
3. **Implement data validation** before saving
4. **Use batch operations** for multiple updates
5. **Add monitoring** for failed operations
