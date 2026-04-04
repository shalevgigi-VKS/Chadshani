# Module 08 — Web Interface

## Objective
A single HTML file that runs in any browser.
User types a topic in Hebrew → receives a complete episode script ready for production.

## Scope
- Input: one Hebrew topic (free text)
- Output: full 3-act script + scene breakdown + voiceover notes + production checklist
- No server required — runs entirely in the browser
- Uses Anthropic Claude API directly from the browser

## File Location
web-interface/index.html

## Setup Requirements
- Modern browser (Chrome, Firefox, Safari, Edge)
- Anthropic API key (entered once in the interface, stored in browser session only)
- Internet connection (for API calls only)

## Behavior

### Input Screen
- Title: "קסם הידיעה — יוצרים פרק חדש"
- Field 1: API key input (password type, not saved to disk)
- Field 2: Topic input in Hebrew (e.g. "גזירת ציפורניים")
- Button: "צור סרטון"

### Processing State
- Loading indicator visible
- Text: "יוצר תסריט..."
- Button disabled during generation

### Playback + Recording State
After script is generated, the interface:
1. Synthesizes Hebrew TTS audio for each scene's lines (two voices: child + animal)
2. Starts background children's music at low volume
3. Plays animation synchronized with TTS — each scene advances as its audio completes
4. Records canvas + TTS audio + background music into a single video
5. When all scenes complete, stops recording automatically

### Output Screen
Displays download button immediately after recording completes.
User sees a preview of the video.

### Actions Available After Generation
- Preview plays automatically
- "הורד סרטון" — downloads .webm file named after the topic
- "פרק חדש" — clears and returns to input screen

## Audio Architecture
Two audio layers combined into the final video:

Layer 1 — TTS Voiceover:
- Hebrew speech synthesized from script lines
- Scene 1 + Scene 5 (child character): one voice profile
- Scenes 2, 3, 4 (animal + key message): second voice profile
- Each line plays sequentially within its scene
- Pause of ~0.5 sec between lines within a scene
- Pause of ~1 sec between scenes

Layer 2 — Background Music:
- A single royalty-free children's instrumental track
- Plays from episode start to end
- Mixed at low volume under voiceover at all times
- Source: embedded or fetched from a reliable royalty-free CDN

## AI Prompt Constraints (enforced in system prompt)
The API call must instruct Claude to:
- Write entirely in Hebrew
- Follow 3-act structure: Question (5–8s) / Explanation (25–35s) / Magic Moment (8–10s)
- Max 4 narration sentences total
- Each sentence max 10 words
- Key message repeated twice
- No scary imagery, no punishment framing
- Suitable for ages 4–7
- Positive ending with reinforcement line
- Tag each line with speaker: "דני" or "צ'יקו" — so TTS can apply the correct voice per line
- Characters: child character named "דני" + animal companion named "צ'יקו הדוב"

## Output Format Contract
The AI returns structured JSON so the interface can:
- Render the animation scene by scene
- Synthesize TTS per line with the correct voice
- Synchronize audio timing with animation duration

## Error Handling
- Invalid API key: display "מפתח API שגוי — בדוק ונסה שוב"
- Network error: display "שגיאת חיבור — בדוק אינטרנט ונסה שוב"
- Empty topic: prevent submission, highlight field
- TTS synthesis failure: display error per scene, allow retry
- Music load failure: continue without music (voiceover must still work)

## Constraints
- No backend, no database, no login
- API key never stored beyond the browser session
- Single HTML file — no build step, no npm, no installation
- Works on mobile browser (responsive layout)
- TTS and music run entirely in the browser
- Final video is produced and downloadable without any server

## Acceptance Criteria
- User types a topic and clicks one button — no other steps required
- Hebrew TTS plays automatically with animation
- Background music audible but clearly softer than voice
- Download produces a ready-to-send .webm file
- Total time from topic input to downloadable video: under 60 seconds
- Interface works on Chrome and Firefox without installation
