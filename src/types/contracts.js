/**
 * Data contracts between the UI and your backend / ML model.
 * The UI only ever sees these shapes. Adapters in src/services convert
 * whatever your API returns into them.
 */

/**
 * @typedef {Object} Detection
 * @property {string} className          human label, e.g. "PET Plastic Bottle"
 * @property {string} rawClass           model class id, e.g. "plastic_bottle"
 * @property {string} category           e.g. "Dry / Recyclable"
 * @property {number} confidence         0..1
 * @property {number} weightG            estimated grams
 * @property {string} grade              e.g. "PET-01"
 * @property {{level: string, label: string, score: number}} contamination  score 0..1
 * @property {string[]} steps            preparation checklist
 * @property {{x: number, y: number, w: number, h: number}} box  normalised 0..1, top-left origin
 * @property {DetectionBox[]} [detections]  every box in the frame, this one first
 */

/**
 * @typedef {Object} DetectionBox
 * @property {string} className
 * @property {string} category
 * @property {number} confidence         0..1
 * @property {{x: number, y: number, w: number, h: number}} box  normalised 0..1
 */

/**
 * @typedef {Object} DisposalAdvice
 * @property {"ok"|"low_confidence"} status
 * @property {"ai"|"rules"|"none"} source            which path produced the guidance
 * @property {boolean} degraded                      true when the model was tried and failed
 * @property {string|null} model                     model id when source is "ai"
 * @property {string|null} summary
 * @property {{bin: string, stream: string, tips: string[]}|null} segregation
 * @property {{type: string, title: string, detail: string, suitability: string}[]} actions
 * @property {string[]} preparation
 * @property {string|null} safety
 * @property {{type: string, why: string}|null} finalAction
 * @property {DropoffFacility[]} facilities          from a maps database, never model-generated
 * @property {string|null} facilitySource
 */

/**
 * @typedef {Object} DropoffFacility
 * @property {string} id
 * @property {string} name
 * @property {string} kind
 * @property {number} distanceKm
 * @property {number} lat
 * @property {number} lon
 * @property {string|null} address
 * @property {string|null} openingHours
 * @property {string|null} phone
 * @property {string[]} accepts
 * @property {string} source
 * @property {string} osmUrl
 */

/**
 * @typedef {Object} LedgerSummary
 * @property {number} points
 * @property {number} streakDays
 * @property {number} itemsScanned
 * @property {number} accuracyPct
 * @property {number} co2OffsetKg
 * @property {{day: string, items: number}[]} weekly   last 7 days, oldest first
 */

/**
 * @typedef {Object} DropoffHub
 * @property {string} name
 * @property {number} distanceKm
 * @property {string} hours
 * @property {number} lat
 * @property {number} lng
 */

/**
 * @typedef {Object} LeaderboardEntry
 * @property {string} id
 * @property {string} name
 * @property {number} points
 * @property {number} streakDays
 * @property {boolean} [isYou]
 */

export {};
