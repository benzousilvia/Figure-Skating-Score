# Figure Skating Score

A JavaScript calculator for figure skating programs under ISU IJS (International Judging System).

## Features

- **Complete Japanese UI**: All interface elements are localized in Japanese
- **2025-26 Season Scale of Values**: Uses official ISU Communication 2707 data
- **5-Rotation Jump Support**: Automatically supports 5T, 5S, 5Lo, 5F, 5Lz based on JSON data
- **Dynamic Element Validation**: Rotation counts are dynamically enabled/disabled based on available elements
- **Real-time Score Calculation**: Automatic TES, PCS, and TSS calculation
- **Element Support**: Jumps, spins, step sequences, and choreo sequences

## Technical Implementation

### Data Source
- **JSON-Based SOV**: Scale of Values loaded from `isu_sov_2025_26_singles_pairs.json`
- **Backwards Compatibility**: Legacy `basevalues.js` interface maintained for existing code
- **Async Loading**: SOV data loaded asynchronously on page load

### 5-Rotation Jump Implementation
- **Data-Driven**: 5-rotation availability determined by JSON data existence
- **Supported Elements**: 5T, 5S, 5Lo, 5F, 5Lz (5A not available per ISU rules)
- **Dynamic UI**: Rotation buttons automatically enabled/disabled per jump type
- **Future-Proof**: Easy season updates by replacing JSON file

### SOV JSON Adaptation
The SOV (Scale of Values) can be easily updated by replacing the JSON file:
- Replace `isu_sov_2025_26_singles_pairs.json` with new season data
- 5-rotation elements automatically reflect based on new data
- No code changes required for standard ISU updates

## File Structure

```
Figure-Skating-Score/
├── index.html                           # Main HTML (Japanese UI)
├── script.js                            # Application logic
├── basevalues.js                        # JSON adapter (maintains compatibility)
├── isu_sov_2025_26_singles_pairs.json   # ISU SOV 2025-26 data
└── style.css                            # Styles with Japanese font support
```

## Usage

1. Open `index.html` in a web browser
2. Select jump rotation, then jump type (dynamic validation)
3. Add elements to calculate scores
4. View TES, PCS, and total scores

## Development

This is a pure client-side application requiring no build process. All dependencies are loaded via CDN.

### Updating Scale of Values
To update to a new ISU season:
1. Replace the JSON file with new SOV data
2. Update filename reference in `basevalues.js` if needed
3. New elements and rotations will automatically be supported

## Browser Compatibility

- Modern browsers with ES6+ support
- Mobile-responsive design with Bootstrap 4
- Japanese font rendering with Noto Sans JP fallback

## License

AGPL-3.0 License