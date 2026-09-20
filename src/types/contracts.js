/**
 * Data contracts between the UI and your backend / ML model.
 * The UI only ever sees these shapes. Adapters in src/services convert
 * whatever your API returns into them.
 */

/**
 * One detected item. The top level of a detection response is the most
 * prominent item, spread over the same shape.
 *
 * @typedef {Object} Detection
 * @property {string} className          human label, e.g. "Plastic Bottle"
 * @property {string} rawClass           model class id, e.g. "plastic_bottle"
 * @property {string} bin                bin routing, e.g. "Dry / Recyclable"
 * @property {string} category           alias of `bin` (kept for the advice + log paths)
 * @property {string} color              hex accent for this class, e.g. "#3B82F6"
 * @property {string} tip                one-line disposal guidance
 * @property {boolean} isHazardous       needs special / hazardous handling
 * @property {number} confidence         0..1
 * @property {string[]} steps            preparation checklist (currently `[tip]`)
 * @property {{x: number, y: number, w: number, h: number}} box  normalised 0..1, top-left origin
 * @property {number} [totalItems]       how many items the backend found in the frame
 * @property {Detection[]} [detections]  every item in the frame, this one first
 * @property {number} [trackId]          stable per-physical-object id from utils/objectTracker,
 *                                        good for React keys and per-item advice state - NOT
 *                                        stable across a camera stop/start (the tracker resets)
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
 * @property {string} name         an OSM `name` tag if one exists, else a generic
 *                                  description synthesized from its category
 * @property {boolean} named       true only for the former - lets the UI say
 *                                  outright whether this is a real place name
 *                                  or just what kind of site it is
 * @property {string|null} locality  for an unnamed site, the neighbourhood/road
 *                                  actually at its coordinates (reverse geocoded,
 *                                  not from the site's own tags) - null if that
 *                                  lookup wasn't run or found nothing
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
 * A waste collection requested from the user's own address. Recorded and
 * tracked by the backend; there is no courier dispatch behind it.
 *
 * @typedef {Object} Pickup
 * @property {string} id                 e.g. "PU-1A2B3C4D"
 * @property {"scheduled"|"cancelled"} status
 * @property {string} createdAt          ISO 8601
 * @property {string|null} cancelledAt   ISO 8601, set once cancelled
 * @property {string} name
 * @property {string} phone
 * @property {string} address
 * @property {string} preferredDate      yyyy-mm-dd
 * @property {string} timeWindow         e.g. "09:00 - 12:00"
 * @property {string[]} wasteTypes       material families being collected
 * @property {string|null} notes
 * @property {number|null} lat           only when the user shared location
 * @property {number|null} lon
 * @property {string|null} facilityName  where it's headed, when chosen
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
 * @typedef {Object} LeaderboardEntry
 * @property {string} id
 * @property {string} name
 * @property {number} points
 * @property {number} streakDays
 * @property {boolean} [isYou]
 */

export {};
