# ChatWindow Test Fix Progress

## Plan Status: ✅ APPROVED - User said "i need all"

**Step 1: Fix ChatWindow.test.tsx Mocking Issues** (IN PROGRESS)

- [x] Create TODO.md ✅
- [ ] Define ALL missing mock functions (mockDeleteMessage1-5, mockSendMessage, mockRefresh)
- [ ] Fix vi.mock/vi.doMock conflict
- [ ] Fix beforeEach mocking pattern
- [ ] Fix createMessagesMock() references
- [ ] Fix individual test mocks
- [ ] Fix confirm() spying pattern
- [ ] Run `npm test --run=ChatWindow.test.tsx` and verify 24/24 pass

**Step 2: Test Verification**

- [ ] All 24 ChatWindow tests pass ✅
- [ ] No ReferenceError: mockDeleteMessage5
- [ ] No TypeError: mockReturnValue is not a function

**Next Tests to Fix After ChatWindow:**

1. **security-utils.test.ts** (12 failures) - logic bugs in security functions
2. **chat-system.test.tsx** (many failures) - missing UI elements, Supabase mocking
3. **ServicesHome tests** - already mostly passing
