The repository contains the following files
- Sample site (`index.html`) that can be used for testing
- Sample script (`sample-test.js`) that can be used to trigger tests on Browserstack.
- Detailed driver logs of the requests that are exchanged between client and the JAR (`sample-driver.log`).

# Selenium WebDriver Test Log Details (`sample-driver.log`)

### Test Flow Summary
This detailed log shows a Selenium test accessing shadow DOM elements inside an iframe, with **request bodies visible** showing exactly what data is sent to WebDriver.

---

## 1. Navigate to Test Page
**POST** `/wd/hub/session/{sessionId}/url`

**Request Body:**
```json
{"url": "https://6403b594f111.ngrok-free.app"}
```

**Response:**
- **Status**: ✅ 200 OK
- **Data**: `{"value": null}`
- **DNS**: `10.8.0.175`
- **Server**: Jetty (9.4.z-SNAPSHOT)

---

## 2. Find All iframe Elements
**POST** `/wd/hub/session/{sessionId}/elements`

**Request Body:**
```json
{"using": "css selector", "value": "iframe"}
```

**Response:**
- **Status**: ✅ 200 OK
- **Elements Found**: Array with 1 iframe
- **Element ID**: `f.EF121A83E77A91A654FCD0AEA8BF5077.d.753943B860B52A6E4D3006DA3AAA93F7.e.6`
- **Response Size**: 127 bytes

---

## 3. Find Single iframe Element
**POST** `/wd/hub/session/{sessionId}/element`

**Request Body:**
```json
{"using": "css selector", "value": "iframe"}
```

**Response:**
- **Status**: ✅ 200 OK
- **Element ID**: `f.EF121A83E77A91A654FCD0AEA8BF5077.d.753943B860B52A6E4D3006DA3AAA93F7.e.6`
- **Element Type**: `element-6066-11e4-a52e-4f735466cecf`

---

## 4. Switch to iframe Context 🎯
**POST** `/wd/hub/session/{sessionId}/frame`

**Request Body:**
```json
{
  "id": {
    "element-6066-11e4-a52e-4f735466cecf": "f.EF121A83E77A91A654FCD0AEA8BF5077.d.753943B860B52A6E4D3006DA3AAA93F7.e.6",
    "ELEMENT": "f.EF121A83E77A91A654FCD0AEA8BF5077.d.753943B860B52A6E4D3006DA3AAA93F7.e.6"
  }
}
```

**Response:**
- **Status**: ✅ 200 OK
- **Data**: `{"value": null}`
- **Action**: WebDriver context switched to iframe content

**💡 Key Insight**: The request body shows **exactly how WebDriver knows which iframe to switch to** - it uses the element reference from step 3!

---

## 5. Find Shadow Host Element (Inside iframe)
**POST** `/wd/hub/session/{sessionId}/element`

**Request Body:**
```json
{"using": "css selector", "value": "*[id=\"shadow-host\"]"}
```

**Response:**
- **Status**: ✅ 200 OK
- **Element ID**: `f.2522FC47F07ED997FC6C84556B5DFA20.d.DC6143852BBC97B3A6D166815C4D3C17.e.7`
- **Context**: Now operating inside iframe (notice different document hash)

**📝 Note**: Document hash changed from `753943B8...` to `DC614385...` indicating we're now in iframe context.

---

## 6. Access Shadow Root
**GET** `/wd/hub/session/{sessionId}/element/{elementId}/shadow`

**Request Body:** _(empty)_

**Response:**
- **Status**: ✅ 200 OK
- **Shadow ID**: `f.2522FC47F07ED997FC6C84556B5DFA20.d.DC6143852BBC97B3A6D166815C4D3C17.e.8`
- **Shadow Type**: `shadow-6066-11e4-a52e-4f735466cecf`

---

## 7. Find Target Element Inside Shadow DOM
**POST** `/wd/hub/session/{sessionId}/shadow/{shadowId}/element`

**Request Body:**
```json
{"using": "css selector", "value": "*[id=\"target-element\"]"}
```

**Response:**
- **Status**: ✅ 200 OK
- **Target Element**: `f.2522FC47F07ED997FC6C84556B5DFA20.d.DC6143852BBC97B3A6D166815C4D3C17.e.9`
- **Context**: Inside shadow DOM of iframe

---

## 8. Extract Text from Shadow DOM Element
**GET** `/wd/hub/session/{sessionId}/element/{elementId}/text`

**Request Body:** _(empty)_

**Response:**
- **Status**: ✅ 200 OK
- **Text Retrieved**: `"Here is the target element!"`
- **Response Size**: 39 bytes

---

## 9. Session Cleanup
**DELETE** `/wd/hub/session/{sessionId}`

**Request Body:** _(empty)_

**Response:**
- **Status**: ✅ 200 OK
- **Connection**: Closed
- **Data**: `{"value": null}`

---

## Key Technical Insights

### 1. Frame Switching Mechanism
The frame switch request shows **exactly** how WebDriver identifies the target iframe:
```json
{
  "id": {
    "element-6066-11e4-a52e-4f735466cecf": "f.EF121A83E77A91A654FCD0AEA8BF5077...",
    "ELEMENT": "f.EF121A83E77A91A654FCD0AEA8BF5077..."
  }
}
```
- Uses **element reference** from previous findElement call
- Includes both W3C (`element-6066...`) and legacy (`ELEMENT`) formats for compatibility

### 2. CSS Selectors Used
- **iframe**: `"iframe"` - Simple tag selector
- **Shadow Host**: `"*[id=\"shadow-host\"]"` - Universal selector with ID attribute
- **Target Element**: `"*[id=\"target-element\"]"` - Universal selector with ID attribute

### 3. Document Context Changes
**Main Document**: `d.753943B860B52A6E4D3006DA3AAA93F7`
**iframe Document**: `d.DC6143852BBC97B3A6D166815C4D3C17`

The document hash changes after frame switching, proving WebDriver is operating in a different document context.

### 4. Shadow DOM Access Pattern
1. Find shadow host element → Get element ID
2. GET `/element/{hostId}/shadow` → Get shadow root ID  
3. POST `/shadow/{shadowId}/element` → Find elements within shadow tree

---

## Request/Response Flow Summary

| Step | Method | Endpoint | Purpose | Key Data |
|------|--------|----------|---------|----------|
| 1 | POST | `/url` | Navigate | URL in body |
| 2 | POST | `/elements` | Find all iframes | CSS selector in body |
| 3 | POST | `/element` | Find single iframe | CSS selector in body |
| 4 | POST | `/frame` | Switch context | Element reference in body |
| 5 | POST | `/element` | Find shadow host | CSS selector in body |
| 6 | GET | `/shadow` | Access shadow root | No body needed |
| 7 | POST | `/shadow/{id}/element` | Find in shadow | CSS selector in body |
| 8 | GET | `/text` | Get element text | No body needed |
| 9 | DELETE | `/session` | Cleanup | No body needed |

---

## Test Success Indicators
✅ All HTTP requests returned 200 OK  
✅ Successfully navigated to ngrok tunnel  
✅ Found iframe using CSS selector  
✅ **Frame switch with element reference worked**  
✅ Located shadow host by ID inside iframe  
✅ Accessed shadow root successfully  
✅ Found target element by ID inside shadow DOM  
✅ Retrieved target text: "Here is the target element!"  
✅ Clean session termination  

---

## Summary
This detailed log reveals the **complete request/response cycle** for a complex Selenium test involving:

1. **iframe Navigation** - Using element references for precise frame switching
2. **Shadow DOM Access** - Proper shadow root acquisition and element finding
3. **CSS Selectors** - Mix of tag selectors and attribute selectors
4. **Context Management** - Document context changes visible in element IDs

The most important revelation is seeing **exactly how the frame switch works** - WebDriver uses the element reference from the previous findElement call to identify which specific iframe to switch to!
