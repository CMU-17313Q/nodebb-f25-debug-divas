**User Guide:**

**First Feature: Favorites Feature**
  **Feature Overview**

    The Favorites feature allows students to mark announcements as favorites, so they can easily view or return to important announcements later.
    When a user clicks the star icon on an announcement, it gets added to their personal Favorites list. Clicking the star again removes it.
    To open their Favorites list, users can double-click the star icon in the sidebar, which redirects them to the /favorites page.
    Favorites are stored per user, and each student can only favorite a specific announcement once.

    How to Use the Feature

      - Log in to your NodeBB student account.
      - Open any announcement in the forum.
      - Click the star icon (⭐) to add it to your favorites.
      - The announcement will now appear on your Favorites page.
      - Double-click the star icon in the sidebar to view your list of favorites.
      - Click the star again to remove an announcement from your favorites.


  **Technical Implementation**
    Frontend
    Implemented/updated in:
    - public/templates/favorites.tpl (Favorites page rendering)
    - public/src/client.js (star click → API toggle, UI update; sidebar double-click → /favorites)
    - public/templates/* (topic/announcement view star placement; PRs show “Add styles fave button to topic and sidebar” and “added star sidebar-left.tpl”)

    Main functionality:
    - Toggle favorite state on star click (filled/outline).
    - Real-time UI update after API success.
    - Sidebar double-click navigates to /favorites.

    Backend
    Implemented/updated in:
    - src/routes/api.js (wires favorites routes)
    - src/routes/favorites.js (favorites route definitions; file appears newly added)
    - src/controllers/api/favorites.js (handlers: create/destroy/list)
    - src/api/favorites.js (data access helpers)
    - src/middleware/permissions.js (access checks touched in PR list)

  **Automated Tests**

    Testing was done in the API/schema conformance test located in test/api.js.
    This test automatically runs each Favorites API endpoint, inspects the JSON response, and checks that every property returned is correctly defined in the OpenAPI schema (public/openapi/read/favorites*.yaml).

    If the backend sends a field that isn’t declared in the schema, the test fails and outputs a clear error message such as:

    assert(schema[prop], `"${prop}" was found in response, but is not defined in schema (path: ${method} ${path}, context: ${context})`);
    This ensures that the backend and schema stay consistent and that no extra or missing fields appear in API responses.

    To run the test:
    - npx mocha test/api.js

  **Manual Testing**

    Manual testing was done to make sure the Favorites feature works properly from the user’s side.
    Each part of the feature was tested by using the actual interface and checking that the behavior matched what was expected:
    ✓ Logged in as a student user. ()
    ✓ Opened an announcement and clicked the star (⭐) icon to favorite it.
    ✓ Checked that the star filled in and the announcement appeared on the Favorites page.
    ✓ Refreshed the page to make sure the favorite stayed saved.
    ✓ Clicked the star again to remove the favorite and confirmed it disappeared from the list.
    ✓ Double-clicked the star icon in the sidebar to ensure it correctly redirected to the /favorites page.

    This testing confirmed that the UI updates in real time, the favorites are stored correctly per user, and the sidebar navigation works as intended.

  **Developer Notes**

  - The main logic for favorites is located in src/api/favorites.js and src/controllers/favorites.js.
  - The routes for all favorites API endpoints are defined in src/routes/favorites.js and connected through src/routes/api.js.
  - The database table for favorites is created by the migration file migrations/2025xxxx-add-favorites-table.js.
  - The front-end page layout is handled in public/templates/favorites.tpl.
  - The sidebar double-click navigation logic is in public/src/client.js.
  - OpenAPI schema files describing the endpoints are stored in public/openapi/read/favorites*.yaml.





  **Second Feature: Emoji Reactions Feature**
    **Feature Overview**
      The Emoji Reactions feature allows users to react to forum posts with emojis such as 😂, 🎉, 😢, 😡, 👏, and 👀.
      Each emoji works as a toggle — clicking once adds a reaction, and clicking again removes it.
      Reaction counts update instantly, and every user can react only once per emoji per post.
      How to Use the Feature
      Log in to your NodeBB account.
      Under any post, click an emoji (for example, 🙌 or 🎉) to add your reaction.
      The counter beside the emoji will appear and increase.
      Click the same emoji again to remove your reaction. When the count reaches zero, it hides automatically.

  **Technical Implementation**
      Frontend
      Implemented in: vendor/nodebb-theme-harmony-2.1.15/templates/partials/topic/post.tpl
      Main functionality:
      Toggles reactions when emojis are clicked
      Shows or hides counts dynamically
      Sends real-time updates to the backend using socket.io

    Backend
    Reaction data is stored in Redis for each post.
    Each post stores reaction counts and the list of users who reacted per emoji.
    The backend logic is handled by src/plugins/reactions.js, which defines:
    toggleReaction(pid, emoji, uid) — adds or removes a user’s reaction
    attachReactionsToPost(post, uid) — retrieves reaction data for API responses
    Backend behavior was manually verified using the developer console:
    socket.emit('plugins.reactions.toggle', { pid: 2, emoji: '🎉' }, console.log);
    This confirmed that reactions toggle correctly and missing fields return validation errors.

  **Automated Tests**
    The backend logic was also tested using Mocha.
    File: test/reactions.test.js
    The tests mock the database layer to validate toggleReaction and attachReactionsToPost without running Redis or a full NodeBB instance.
    Tests included:
    Exports check for both core functions
    Validation for missing fields
    Error handling for unsupported emojis
    All tests passed successfully:
    3 passing (2ms)
    ✅ Mocked reactions tests finished successfully
    These automated tests ensure backend reliability and full coverage of the core feature logic.

  **Automated Schema Test**
    In public/openapi/components/schemas/PostObject.yaml, two new fields were added:
    reactions:
      type: object
      additionalProperties:
        type: number
      description: Emoji reactions and their counts
      example: { "🎉": 1, "😂": 2 }

    myReactions:
      type: array
      items:
        type: string
      description: Emojis reacted to by the current user
      example: ["🎉"]

    These fields ensure that API responses include both total reaction counts and the current user’s reactions.
    Acceptance Criteria Summary
    - Reaction buttons appear correctly under each post
    - Emojis toggle on and off as expected
    - Reaction counts update in real time through sockets
    - Backend stores and retrieves reaction data accurately
    - The schema includes reactions and myReactions fields in PostObject

  **Manual Testing**
    Open any topic and click an emoji under a post
    Verify the counter updates immediately
    Click the same emoji again to remove your reaction
    Use the developer console command to test backend toggling

  **Developer Notes**
    To add new emojis, edit the ALLOWED_REACTIONS array in:
    src/plugins/reactions.js
    const ALLOWED_REACTIONS = ['👍', '😂', '🎉', '🔥', '💯'];
    Restart NodeBB after making changes for them to appear.

**Third Feature: Profanity Filtering Feature**
  **Feature Overview**
    The Profanity Filtering system automatically detects and handles inappropriate language
    in posts and chat messages. Administrators can choose between two modes: Block Mode
    (prevents posting) or Filter Mode (replaces profanity with asterisks like "d***"). The
    system uses the bad-words library and provides real-time feedback to users.
    How to Use the Feature
    For Administrators:
    1. Log in to your NodeBB admin account
    2. Navigate to Admin Control Panel → Settings → Posts → Profanity Filter section
    3. Select your preferred mode:
      - Block Mode: Users see an error and cannot post profane content
      - Filter Mode: Profanity is automatically replaced with asterisks
    4. Click Save — settings take effect immediately
    For Users:
    1. Create a post or send a chat message as normal
    2. If profanity is detected in Block Mode, you'll see: "Cannot Post - You wrote a swear
    word. Please remove inappropriate language and try again."
    3. In Filter Mode, your content is posted automatically with profanity replaced by
    asterisks

  **Technical Implementation**
    Frontend
    - Implemented in: public/src/modules/profanity.js and
    public/src/client/chats/messages.js
    - Main functionality:
      - Checks content via API before submission
      - Shows error notifications in Block Mode
      - Applies filtered content in Filter Mode
      - Works with posts, quick replies, and chat messages

    Backend
    - Core filter service: src/profanity/filter.js using bad-words npm package
    - Automatic filtering integrated in:
      - src/posts/create.js and src/posts/edit.js — filters all posts
      - src/api/chats.js (lines 130, 412) — filters chat messages
    - Admin API endpoints in src/api/admin.js:
      - getBannedWords() — retrieves banned words list
      - addBannedWord({ word }) — adds custom banned word
      - removeBannedWord({ word }) — removes word from filter
    - Profanity check API: POST /api/v3/posts/profanity-check returns action and filtered
    content
    - Admin settings stored in meta.configs.profanityAction
    Backend behavior was verified using curl commands and browser testing with both Block
    and Filter modes.

  **Automated Tests**
    File: test/profanity.js
    The test suite validates all core functionality using Mocha framework with real NodeBB
    modules (not just mocks).

    Tests included:
    - Filter Service (5 tests): Core filtering, word detection, ban list management
    - Post Integration (2 tests): Automatic filtering on post creation and editing
    - Chat Integration (1 test): Automatic filtering in chat messages
    - API Integration (5 tests): Profanity check endpoint behavior in both modes
    - Admin Settings (4 tests): Settings persistence and behavior changes
    - Controller Integration (1 test): HTTP request handling
    - Topic Posting (2 tests): End-to-end post creation with filtering
    - Error Handling (3 tests): Invalid inputs, missing parameters, large content
    - Performance (3 tests): Unicode support, concurrent calls, setting changes

    All tests passed successfully:
    26 passing
    ✅ Profanity filter tests finished successfully

    These automated tests ensure backend reliability, proper integration with posts and
    chats, and full coverage of both Block and Filter modes.

  **Automated Schema Test**
    Admin settings template was updated in src/views/admin/settings/post.tpl:
    <div class="form-group">
      <label>Profanity Filter Action</label>
      <select name="profanityAction" class="form-control">
        <option value="block">Block posts containing profanity</option>
        <option value="filter">Filter profanity with asterisks</option>
      </select>
    </div>

    API schemas documented in public/openapi/write/posts/pid/ include profanity check
    endpoint with request/response formats for both modes.

  **Acceptance Criteria Summary**
    - Profanity detection works in posts, quick replies, and chat messages
    - Block Mode prevents posting and shows clear error notification
    - Filter Mode replaces profanity with asterisks automatically
    - Admin settings persist and affect behavior immediately
    - Backend stores settings in database and applies them consistently
    - Admin API allows programmatic banned word management
    - All 26 automated tests pass with 100% success rate

  **Manual Testing**
    1. Set profanity action to "Block" in admin settings
    2. Try posting "This is a damn test" in a topic or chat
    3. Verify error notification appears and content is not posted
    4. Change setting to "Filter" mode
    5. Post the same content and verify it appears as "This is a d*** test"
    6. Test chat messages, post editing, and quick replies similarly

  **Developer Notes**
    To extend profanity filtering to additional content types:
    const profanityFilter = require('../profanity/filter');
    const meta = require('../meta');

    // Get admin setting
    const action = await meta.configs.get('profanityAction') || 'block';

    // Check and filter
    if (action === 'block' && profanityFilter.isProfane(content)) {
      throw new Error('[[error:profanity-detected]]');
    } else if (action === 'filter') {
      content = profanityFilter.clean(content);
    }

    To add custom banned words via API:
    curl -X POST /api/v3/admin/banned-words \
      -H "Authorization: Bearer TOKEN" \
      -d '{"word": "customword"}'

    Restart NodeBB after modifying core filter settings for changes to take effect.


**Fourth Feature: Reading Time Feature**
  **Feature Overview**

    The Reading Time feature automatically calculates how long it would take to read a post or reply in NodeBB.
    It uses the total word count of the content and assumes an average reading speed of 200 words per minute.
    If a post is short (under 100 words), it shows “<30s”, while longer posts show rounded times like “~1 min” or “~3 min read”.
    This feature helps users understand the approximate time needed to read a topic before opening or posting it.

  **How to Use the Feature**

    1. Start typing or pasting text in the NodeBB composer.
    2. The reading time automatically appears below or beside the composer, next to the word and character counts.
    3. Edit or delete text to see the time update in real time.
    4. Reading time updates automatically — no manual refresh or input required.

    Examples:
    20 words: <30s
    200 words: ~1 min
    420 words: ~2 min

  **Technical Implementation**

    Frontend:
    Implemented in: public/src/textMetrics.js and integrated with public/src/client.js

    Main functionality:
    - Calculates the reading time based on total word count
    - Displays the result dynamically inside the composer interface
    - Updates instantly whenever the user types or edits text

    Core Function:
      function estimateReadingTime(wordCount, wpm = 200) {
        if (!wpm || wpm <= 0) wpm = 200;
        const minutes = wordCount / wpm;
        if (minutes < 0.5) return '<30s';
        return `~${Math.round(minutes)} min`;
      }
    The reading time is calculated using the existing countWords() function and displayed together with word and character counts inside the composer UI.

    Backend
    - The logic is fully handled on the frontend, so no additional backend storage or processing was needed.

  **Automated Tests**
    The feature was tested using Mocha to ensure accurate results under different text conditions.
    File: test/wordCount.js

    Tests included:
    - Verification of <30s output for short posts
    - Correct rounding for longer posts
    - Handling of invalid or missing WPM values
    - Integration check between countWords() and estimateReadingTime()

    Example Test Results:
      estimateReadingTime()
        ✓ returns <30s for short posts
        ✓ rounds to nearest minute for longer posts
        ✓ uses custom WPM correctly
        ✓ defaults to 200 when input invalid

    All tests passed successfully, confirming that reading time calculations are accurate and reliable.

  **Manual Testing**

    1. Open the composer and begin typing a post.
    2. Check that the reading time appears below the text box.
    3. Add or remove words and verify that the reading time updates automatically.
    4. Test with short and long posts to confirm correct output (for example, 20 words → “<30s”, 250 words → “~1 min”).

  **Developer Notes**

    To adjust the reading speed, change the default value in estimateReadingTime(wordCount, wpm).
    If the feature does not appear in the composer, rebuild NodeBB using ./nodebb build.