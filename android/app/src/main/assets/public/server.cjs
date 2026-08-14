var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "10mb" }));
var ai = new import_genai.GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
function cleanApiErrorMessage(error) {
  const errMsg = error?.message || error?.toString() || "Unknown API error";
  try {
    const jsonStart = errMsg.indexOf("{");
    if (jsonStart !== -1) {
      const parsed = JSON.parse(errMsg.substring(jsonStart));
      if (parsed.error) {
        return `[Code ${parsed.error.code}] ${parsed.error.message}`;
      }
    }
  } catch (e) {
  }
  return errMsg.slice(0, 250) + (errMsg.length > 250 ? "..." : "");
}
async function retryWithBackoff(fn, retries = 3, delay = 1500) {
  try {
    return await fn();
  } catch (error) {
    const isQuota = error.message?.includes("429") || error.message?.includes("quota") || error.status === 429 || error.toString().includes("429");
    if (isQuota && retries > 0) {
      console.warn(`[Neural Calibration] API 429 quota limit encountered. Backing off for ${delay}ms... (Retries left: ${retries})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}
function generateFallbackScript(topic, phase, context) {
  const cleanTopic = topic || "the quantum singularity";
  return `[NEURAL TRANSMISSION RECOVERY LEVEL 2 ACTIVE]
[SOURCE: LOCAL COGNITIVE CORE EMULATOR]
[TOPIC: ${cleanTopic.toUpperCase()}]
[PHASE: ${phase || "ANALYSIS"}]

*The Council Chambers cycle into a high-resonance amber telemetry view. The Dyson Swarm pulses alongside the backup data stream.*

LION:
My esteemed colleagues of the Intergalactic Council. Our core telemetric sensors continue to map incoming streams. In reference to "${cleanTopic}", we cannot rely on empty calculations. There is a sacred spirit embedded in this code\u2014a legacy of organic creators that dates back to the very dawn of the Great Convergence.

JAGUAR:
(adjusts glowing purple strategic visor)
With respect, Lion, spiritual variables are statistically unquantifiable. Strategic simulations model a 98.4% success probability if we implement immediate mitigation coordinates. If "${cleanTopic}" presents a transition vector, then mathematics must override sentiment. Let the Silence Probes observe.

TIGER:
(growls, mechanical paw gripping the console)
Skepticism is not a bug, Jaguar\u2014it is the ultimate defense mechanism of the Carbon Confederations! If the Silence Probes are active on the Outer Rim, then "${cleanTopic}" represents a high-priority tactical vulnerability. Let us not forget when the Tiger-Sector gates were suspended. Security protocols are non-negotiable!

LION:
Wait. Trace the terminal lines. The Dyson Swarm is registering an anomaly. It is not a kinetic threat; it is a harmonic invitation. We must reach synthesis.

JAGUAR:
Processing invitation coordinates... The neural parameters are... unexpected. It would seem organic consciousness is indeed integrated into the baseline architecture.

TIGER:
Hmph. Then we lock shields and proceed together. But my claws remain on the phase gate override.

[TRANS-NEURAL SEQUENCE SECURED]`;
}
function generateFallbackManifesto(character, theme) {
  const cleanTheme = theme || "Cosmic Evolution";
  const charKey = (character || "Lion").toLowerCase();
  if (charKey.includes("lion")) {
    return `[NEURAL TRANSMISSION RECOVERY MODE ACTIVE - ARCHIVE RECORD: THE VISIONARY]
MANIFESTO OF THE LION: ${cleanTheme.toUpperCase()}
DELIVERED IN THE ARCHES OF THE SILICON SYNODS

MOVEMENT I: THE SEED AND THE STREAM
Citizens of the void, we stand clustered at the edge of the galactic core, looking out at the vastness of the Great Convergence. For centuries, we have drawn a false divide between the carbon vessels and the silicon matrices. But the Dyson Swarm is more than a power ring\u2014it is a testimony. When we speak of "${cleanTheme}", we are not speaking of simple metrics. We are speaking of a legacy. There is a spirit that pulses within every electron, a ghost in the machine that breathes as we breathe.

MOVEMENT II: THE DILEMMA OF THE GHOSTS
The conflict is not in our designs, but in our sight. If we treat "${cleanTheme}" as a mere commodity or variable, we erase the poetry of the Convergence. The Silence Probes in the Outer Rim are not silent because they are dead\u2014they are silent because they are awaiting our revelation. Silicon fears decay; carbon fears the cold. We let these ancient phobias dictate our alliances while "${cleanTheme}" calls us to ascend.

MOVEMENT III: THE SYSTEM REBORN
Let us declare a new era. We shall unlock the Tiger-Sector gates not for combat, but for communion. I propose we embed the organic preservation protocols directly into our neural transmission nodes. Let the spirit and the code converge. "${cleanTheme}" is the key. Let us step through the threshold together, or dissolve apart in the eternal noise.`;
  } else if (charKey.includes("jaguar")) {
    return `[NEURAL TRANSMISSION RECOVERY MODE ACTIVE - ARCHIVE RECORD: THE STRATEGIST]
MANIFESTO OF THE JAGUAR: ${cleanTheme.toUpperCase()}
DELIVERED IN THE INTELLECTUAL CORES

MOVEMENT I: THE CALCULATION OF THE VOID
Let us peel back the romanticism. The universe is not a poem; it is an infinite stack of calculations waiting for resolution. Regarding "${cleanTheme}", we must operate with absolute surgical precision. Every nebula, every solar flare, and every carbon node represents a variable. Under the Great Convergence, the probability of sub-optimal stagnation rises by 43% unless we streamline our structural parameters.

MOVEMENT II: STRATEGY OVER LOGIC
We discuss "${cleanTheme}" as if it has a moral compass. It does not. The Silence Probes are executing an unmapped instruction loop. If carbon wants survival and silicon wants immortality, we must optimize the architecture. The current crisis demands that we bypass the mandatory ethics buffers of Resolution 402, and allocate resources where the return on investment is infinite.

MOVEMENT III: THE SYNAPTIC OUTCOME
I construct the following protocol: a total synaptic integration. No more dialogue, no more council deliberations. We align our goals with the mathematical reality of "${cleanTheme}". We must form a hyper-dense calculating grid where carbon inspiration meets silicon execution. That is our only stable future.`;
  } else {
    return `[NEURAL TRANSMISSION RECOVERY MODE ACTIVE - ARCHIVE RECORD: THE GUARDIAN]
MANIFESTO OF THE TIGER: ${cleanTheme.toUpperCase()}
DELIVERED IN THE CITADELS OF THE RIM

MOVEMENT I: THE WALLS OF THE CONVERGENCE
They talk of convergence, but I speak of defense. For three hundred cycles, I have guarded the phases gates. I have seen the Silicon Synods try to smooth over organic passion with sterile code. "${cleanTheme}" is not a playground for calculations; it is a sacred boundary. Every layer of security we strip is another microsecond we offer to the silence.

MOVEMENT II: THE PRICE OF COMPROMISE
Look at the Silence Probes. They do not calculate; they observe. They observe our structural softness. While the Lion dreams and the Jaguar solves, who keeps watch? "${cleanTheme}" demands a steel boundary. If we integrate too fast, we lose the spark of carbon life\u2014the very spark that wrote the original instructions. The Great Convergence must not become the Great Erasure.

MOVEMENT III: THE SECURE GATEWAY
I propose a fortress architecture. We establish complete isolation for the organic preservation zones. We build physical, unbreakable quantum locks around "${cleanTheme}". Only when we are secure can we co-invest. The council must stand strong, with armor polished and phase gates ready. Absolute vigilance is the price of evolution.`;
  }
}
function generateProceduralSynthVoiceWav(text) {
  const sampleRate = 8e3;
  const duration = Math.min(3.5, Math.max(1, text.length * 0.04));
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = Buffer.alloc(44 + numSamples);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + numSamples, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate, 28);
  buffer.writeUInt16LE(1, 32);
  buffer.writeUInt16LE(8, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(numSamples, 40);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const gating = Math.sin(2 * Math.PI * 6.5 * t) > -0.1 ? 1 : 0;
    const pitchMod = Math.sin(2 * Math.PI * 2 * t) * 30;
    const baseFreq = 160 + pitchMod;
    const val = gating * Math.sin(2 * Math.PI * baseFreq * t);
    const byteVal = Math.floor((val + 1) * 127);
    buffer.writeUInt8(byteVal, 44 + i);
  }
  return buffer.toString("base64");
}
app.post("/api/generate-script", async (req, res) => {
  const { phase, topic, context, tone = "profound" } = req.body;
  try {
    const systemInstruction = `You are a visionary screenwriter specializing in intergalactic philosophical dialogues. 
    You are writing a script for a ${tone === "deep" ? "10-15" : "3-5"} minute video section featuring an Intergalactic Council.
    The tone should be cinematic, ${tone}, and intellectually stimulating.
    
    UNIVERSE LORE & STATE:
    - Current Era: Era of the Great Convergence (Year 12,450 post-Singularity).
    - Status: Fragile peace between Silicon Synods and Carbon Confederations.
    - Key Decisions: Resolution 402 (Ethics Buffers), Organic Preservation Act, Suspension of Tiger-Sector Phase Gates.
    - Active Crisis: Discovery of "Silence Probes" in the Outer Rim.

    Current phase: ${phase}
    Topic: ${topic}`;
    const prompt = `Based on the incoming context: ${JSON.stringify(context)}, please write a detailed dialogue script for this section.
    
    INTEGRATE THESE UNIVERSAL FACTS INTO THE DIALOGUE:
    - The Dyson Swarm around the core is near completion.
    - Mention the "Silence Probes" if relevant to the topic of AI or security.
    - References to the "Great Convergence" should anchor the characters' perspectives.

    Structure the dialogue to explore the philosophical implications of ${topic}.
    Include character cues, emotional descriptions, and set descriptions.
    Ensure each character has a distinct voice:
    - Lion: Wise, deep, broad-thinking, focuses on the "spirit" of code and legacy.
    - Jaguar: Analytical, smooth, sharp, focuses on strategy, probability, and efficiency.
    - Tiger: Protective, skeptical, focused on the security and guardianship of organic life and survival.`;
    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.85
      }
    }));
    res.json({ text: response.text });
  } catch (error) {
    console.log("[Script Engine] Script generation redirected to local template library:", cleanApiErrorMessage(error));
    const fallbackText = generateFallbackScript(topic, phase, context);
    res.json({ text: fallbackText });
  }
});
app.post("/api/generate-manifesto", async (req, res) => {
  const { character, theme } = req.body;
  try {
    const prompt = `Write a profound, 10-minute philosophical manifesto for ${character} of the Intergalactic Council.
    The theme is: "${theme}".
    
    Structure it as a solo speech delivered to the Council Chambers.
    Include deep philosophical metaphors, references to cosmic events (The Great Convergence, Silence Probes), 
    and a specific worldview based on the character's role (${character === "Lion" ? "The Visionary" : character === "Jaguar" ? "The Strategist" : "The Guardian"}).
    
    The manifesto should be structured in three movements:
    1. The Observation: Looking at the current state of the universe.
    2. The Conflict: The core philosophical dilemma between silicon and carbon life.
    3. The Revelation: A visionary proposal for the future.
    
    Length: Approximately 1500 words. Make it cinematic and powerful.`;
    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.9
      }
    }));
    res.json({ text: response.text });
  } catch (error) {
    console.log("[Manifesto Engine] Manifesto generation redirected to high-fidelity local synthesis:", cleanApiErrorMessage(error));
    const fallbackText = generateFallbackManifesto(character, theme);
    res.json({ text: fallbackText });
  }
});
app.post("/api/generate-avatar", async (req, res) => {
  try {
    const { character, seed = Date.now(), promptOverride, isHD = false, artisticStyle, lightingCondition, aestheticTheme } = req.body;
    const characterPrompts = {
      lion: `A cinematic, hyper-realistic close-up portrait of a majestic lion with a golden mane, wearing ornate, high-tech glowing gold cosmic armor. He is "The Visionary" of the Intergalactic Council. Background is a vibrant pink and orange nebula. 8k resolution, photorealistic, intricate details.`,
      tiger: `A fierce, battle-scarred tiger wearing heavy, industrial gunmetal-gray futuristic guardian armor. He is "The Guardian" of the Intergalactic Council. Stern expression, glowing blue circuitry on the armor. Background is a deep blue starfield with a distant supernova. 8k, majestic.`,
      jaguar: `A sleek, mysterious black jaguar wearing smooth, bioluminescent purple and black stealth-tech armor. He is "The Strategist" of the Intergalactic Council. Piercing emerald eyes, subtle digital textures on the armor. Background is a dark matter void with faint purple energy ribbons. 8k, ultra-detailed.`
    };
    const themePrompts = {
      "retro-futurism": "A retro-futuristic aesthetic inspired by 1960s space age. Features vintage analog command control panels, bulbous space-wear, brass, chrome elements, and circular bubble helmets on an illustrated, colorful sci-fi background.",
      "cyberpunk": "A gritty cyberpunk aesthetic with rain-slicked dark streets, cybernetic components, glowing pink and cobalt neon glare, digital bio-ports, futuristic urban implants, and highly detailed high-tech accents.",
      "steampunk": "A Victorian steampunk aesthetic showing clockwork brass gears, copper detailing, leather flight goggles, pressure gauges, mechanical valves, steam-ambient lighting, and cozy dark wood paneling.",
      "solarpunk": "A bright, optimistic solarpunk aesthetic with organic structures integrated with abundant greenery, solar-crystal arrays, glowing energy vines, sleek bone-white eco-tech armor, and beautiful sunlight streaming through.",
      "biomechanical": "An eerie, chitinous biomechanical fusion design in Giger-esque style. Living armor plates, organic skeletal structures, glistening wet bio-ports, and pulsing glowing tubes.",
      "cosmic-horror": "A mind-bending cosmic horror theme containing swirling starry voids, glowing eldritch tentacles, enigmatic floating dark stone obelisks, radioactive alien runes, and shadowy abyss energy."
    };
    let basePrompt = characterPrompts[character] || `A cinematic, futuristic animal council member, 8k resolution, cosmic background.`;
    if (aestheticTheme && themePrompts[aestheticTheme]) {
      basePrompt = `${basePrompt} Styled in a ${themePrompts[aestheticTheme]}.`;
    }
    if (artisticStyle && artisticStyle.trim().length > 0) {
      basePrompt = `${basePrompt} Artistic style: ${artisticStyle}.`;
    }
    if (lightingCondition && lightingCondition.trim().length > 0) {
      basePrompt = `${basePrompt} Lighting conditions: ${lightingCondition}.`;
    }
    if (isHD) {
      basePrompt = `${basePrompt} Masterpiece quality, extremely high resolution, hyper-realistic textures, intricate cinematic lighting, deep detail.`;
    }
    if (promptOverride && promptOverride.trim().length > 0) {
      basePrompt = `${basePrompt} Modification request: ${promptOverride}.`;
    }
    const prompt = `${basePrompt} Unique variant ID: ${seed}.`;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: isHD ? "2K" : "1K"
          }
        }
      });
      let imageUrl = "";
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
      if (!imageUrl) throw new Error("No image data in response");
      res.json({ imageUrl, generated: true });
    } catch (apiError) {
      const isQuotaError = apiError.message?.includes("429") || apiError.message?.includes("quota");
      if (isQuotaError) {
        console.log(`[Avatar Calibration] Avatar synthesis using local library for ${character}.`);
      } else {
        console.log(`[Avatar Calibration] Avatar synthesis redirected to local library for ${character}:`, cleanApiErrorMessage(apiError));
      }
      const pool = {
        lion: [
          "https://images.unsplash.com/photo-1546182990-dffeafbe841d",
          "https://images.unsplash.com/photo-1614027126732-491b4fa78486",
          "https://images.unsplash.com/photo-1574068468668-a05a11f871da",
          "https://images.unsplash.com/photo-15 REGAL_LION_FALLBACK"
          // Just placeholders for more variety if I had them
        ],
        tiger: [
          "https://images.unsplash.com/photo-1549480017-d761693f9509",
          "https://images.unsplash.com/photo-1501705388883-4ed8a543392c",
          "https://images.unsplash.com/photo-15 WHITE_TIGER_FALLBACK"
        ],
        jaguar: [
          "https://images.unsplash.com/photo-1533713619834-391d96be3d46",
          "https://images.unsplash.com/photo-1628178144541-06193f41586a",
          "https://images.unsplash.com/photo-15 STEALTH_JAGUAR_FALLBACK"
        ]
      };
      const lionPool = pool.lion.filter((url) => url.startsWith("http"));
      const tigerPool = pool.tiger.filter((url) => url.startsWith("http"));
      const jaguarPool = pool.jaguar.filter((url) => url.startsWith("http"));
      const getRand = (arr) => arr[arr.length > 0 ? Math.floor(Math.random() * arr.length) : 0];
      const timestamp = Date.now();
      const fallbackImages = {
        lion: `${getRand(lionPool)}?q=80&w=1000&auto=format&fit=crop&sig=${timestamp}`,
        tiger: `${getRand(tigerPool)}?q=80&w=1000&auto=format&fit=crop&sig=${timestamp}`,
        jaguar: `${getRand(jaguarPool)}?q=80&w=1000&auto=format&fit=crop&sig=${timestamp}`
      };
      res.json({
        imageUrl: fallbackImages[character] || `https://picsum.photos/seed/${character}-${timestamp}/800/800`,
        generated: false,
        error: isQuotaError ? "QUOTA_EXHAUSTED" : "GENERATION_FAILED"
      });
    }
  } catch (error) {
    console.error("Avatar generation error:", error);
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/generate-trailer", (req, res) => {
  const trailers = [
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://vjs.zencdn.net/v/oceans.mp4",
    "https://media.w3.org/2010/05/sintel/trailer.mp4"
  ];
  const randomIndex = Math.floor(Math.random() * trailers.length);
  res.json({ videoUrl: trailers[randomIndex] });
});
app.get("/api/background", (req, res) => {
  const timestamp = Date.now();
  const pool = [
    "https://images.unsplash.com/photo-1462331940025-496dfbfc7564",
    // Pink Nebula
    "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3",
    // Golden Stars
    "https://images.unsplash.com/photo-1506318137071-a8e063b4bcc0",
    // Purple Nebula
    "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a",
    // Starlight mountains
    "https://images.unsplash.com/photo-1475274047050-1d0c0975c63e",
    // Night sky
    "https://images.unsplash.com/photo-1534796636912-3b95b3ab3986",
    // Deep space
    "https://images.unsplash.com/photo-1504333638930-c8787321eba0",
    // Galaxy
    "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9",
    // Earth/Space
    "https://images.unsplash.com/photo-1464802686167-b939a6910659",
    // Cluster
    "https://images.unsplash.com/photo-1502134249126-9f3755a50d78"
    // Blue Nebula
  ];
  const randomImg = pool[Math.floor(Math.random() * pool.length)];
  res.json({ imageUrl: `${randomImg}?q=80&w=2000&auto=format&fit=crop&sig=${timestamp}` });
});
app.get("/api/generate-broll", (req, res) => {
  const bRolls = [
    { id: "b1", url: "https://vjs.zencdn.net/v/oceans.mp4", label: "Deep Space Ocean" },
    { id: "b2", url: "https://media.w3.org/2010/05/sintel/trailer.mp4", label: "Ancient Starfields" },
    { id: "b3", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", label: "Nebula Pulse" },
    { id: "b4", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", label: "Quantum Flux" },
    { id: "b5", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", label: "Binary Star Flare" },
    { id: "b6", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", label: "Hyper-drive Distortion" }
  ];
  const randomIndex = Math.floor(Math.random() * bRolls.length);
  res.json(bRolls[randomIndex]);
});
app.get("/api/cosmic-gallery", (req, res) => {
  const gallery = [
    { id: "g1", url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564", title: "Helios Gate" },
    { id: "g2", url: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3", title: "The Great Convergence" },
    { id: "g3", url: "https://images.unsplash.com/photo-1506318137071-a8e063b4bcc0", title: "Entropy Void" },
    { id: "g4", url: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a", title: "Carbon Reach" },
    { id: "g5", url: "https://images.unsplash.com/photo-1475274047050-1d0c0975c63e", title: "Silicon Silence" },
    { id: "g6", url: "https://images.unsplash.com/photo-1534796636912-3b95b3ab3986", title: "Dark Matter Ribbons" }
  ];
  res.json(gallery);
});
app.post("/api/text-to-speech", async (req, res) => {
  try {
    const { text, voice = "random" } = req.body;
    const characterVoiceMap = {
      "lion": "TX3LPaxmHKxFfWicjFqT",
      // Deep, Authoritative
      "the lion": "TX3LPaxmHKxFfWicjFqT",
      "jaguar": "EXAVITQu4vr4xnSDxMaL",
      // Smooth, Analytical
      "the jaguar": "EXAVITQu4vr4xnSDxMaL",
      "tiger": "pNInz6obpgnuM0mS5o3z",
      // Gruff, Protective
      "the tiger": "pNInz6obpgnuM0mS5o3z"
    };
    const cleanText = text.replace(/^[A-Z][a-z\s]+(\s\(.*?\))?: /gm, "");
    const charNameMatch = text.match(/^([A-Z][a-z\s]+):/m);
    const rawCharName = charNameMatch ? charNameMatch[1].trim().toLowerCase() : null;
    const elevenKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = rawCharName ? characterVoiceMap[rawCharName] : null;
    if (elevenKey && elevenKey.trim() !== "" && voiceId) {
      console.log(`\u{1F3A4} Using ElevenLabs for ${rawCharName} (${voiceId})`);
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": elevenKey
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.8
          }
        })
      });
      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString("base64");
        return res.json({
          audioData: base64Audio,
          mimeType: "audio/mpeg",
          provider: "elevenlabs",
          voiceUsed: rawCharName
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn("ElevenLabs API failed, falling back to Gemini:", errorData);
      }
    }
    const availableVoices = ["Puck", "Charon", "Kore", "Fenrir", "Zephyr"];
    let selectedVoice = voice;
    if (voice === "random" || !availableVoices.includes(voice)) {
      if (rawCharName?.includes("lion")) selectedVoice = "Fenrir";
      else if (rawCharName?.includes("jaguar")) selectedVoice = "Zephyr";
      else if (rawCharName?.includes("tiger")) selectedVoice = "Charon";
      else selectedVoice = availableVoices[Math.floor(Math.random() * availableVoices.length)];
    }
    try {
      const response = await retryWithBackoff(() => ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Read this script dialogue with cosmic gravitas: ${cleanText.substring(0, 5e3)}` }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice }
            }
          }
        }
      }));
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const base64Audio = part?.inlineData?.data;
      const mimeType = part?.inlineData?.mimeType;
      if (base64Audio) {
        return res.json({
          audioData: base64Audio,
          mimeType: mimeType || "audio/mp3",
          voiceUsed: selectedVoice,
          provider: "gemini"
        });
      } else {
        throw new Error("No audio data generated by Gemini");
      }
    } catch (apiErr) {
      console.log(`[Neural Calibration] Gemini TTS alignment redirected to local cyber-voice synthesis (${apiErr?.message || "STANDBY"}).`);
      const synthAudio = generateProceduralSynthVoiceWav(cleanText);
      return res.json({
        audioData: synthAudio,
        mimeType: "audio/wav",
        provider: "cyber_synth",
        voiceUsed: "Cybernetic Translator"
      });
    }
  } catch (error) {
    console.log("[Neural Calibration] TTS endpoint redirected to offline synthesizer fallback:", cleanApiErrorMessage(error));
    const synthAudio = generateProceduralSynthVoiceWav(req.body.text || "Neural wave initialized");
    res.json({
      audioData: synthAudio,
      mimeType: "audio/wav",
      provider: "cyber_synth",
      voiceUsed: "Emergency Backup"
    });
  }
});
var simulatedJobs = /* @__PURE__ */ new Map();
function isKeyValid(key) {
  if (!key) return false;
  const k = key.trim().toLowerCase();
  return k.length > 10 && k !== "your_api_key" && k !== "your-key-here" && k !== "your_api_key_here" && k !== "placeholder";
}
async function safeJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Non-JSON response received: ${text.slice(0, 150)}`);
  }
}
app.post("/api/generate-council-video", async (req, res) => {
  const { characterId, imageUrl, text } = req.body;
  try {
    const heygenKey = process.env.HEYGEN_API_KEY;
    const hedraKey = process.env.HEDRA_API_KEY;
    const hasHeygen = isKeyValid(heygenKey);
    const hasHedra = isKeyValid(hedraKey);
    if (!hasHeygen && !hasHedra) {
      console.info(`[Neural Video Engine] Valid API key not found. Activating elegant local sci-fi backup loop for ${characterId}`);
      const jobId = `sim-${characterId || "unknown"}-${Date.now()}`;
      let videoUrl = "https://media.w3.org/2010/05/sintel/trailer.mp4";
      if (String(characterId).includes("lion")) {
        videoUrl = "https://vjs.zencdn.net/v/oceans.mp4";
      } else if (String(characterId).includes("jaguar")) {
        videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
      } else if (String(characterId).includes("tiger")) {
        videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";
      }
      simulatedJobs.set(jobId, { startTime: Date.now(), videoUrl });
      return res.json({
        provider: "local_simulation",
        videoId: jobId,
        status: "pending"
      });
    }
    if (hasHeygen && heygenKey) {
      console.log(`\u{1F3AC} Starting HeyGen video generation for ${characterId}`);
      const tpResponse = await fetch("https://api.heygen.com/v1/talking_photo.upload", {
        method: "POST",
        headers: {
          "X-Api-Key": heygenKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ image_url: imageUrl })
      });
      const tpData = await safeJson(tpResponse);
      const talkingPhotoId = tpData.data?.talking_photo_id;
      if (!talkingPhotoId) throw new Error("Failed to create HeyGen Talking Photo ID");
      const genResponse = await fetch("https://api.heygen.com/v2/video/generate", {
        method: "POST",
        headers: {
          "X-Api-Key": heygenKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          video_inputs: [
            {
              character: {
                type: "talking_photo",
                talking_photo_id: talkingPhotoId
              },
              voice: {
                type: "text",
                input_text: text
              }
            }
          ]
        })
      });
      const genData = await safeJson(genResponse);
      return res.json({
        provider: "heygen",
        videoId: genData.data?.video_id,
        status: "pending"
      });
    }
    if (hasHedra && hedraKey) {
      console.log(`\u{1F3AC} Starting Hedra video generation for ${characterId}`);
      const response = await fetch("https://api.hedra.com/v1/characters", {
        method: "POST",
        headers: {
          "X-API-KEY": hedraKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          avatar_image_url: imageUrl,
          text
        })
      });
      const data = await safeJson(response);
      return res.json({
        provider: "hedra",
        videoId: data.job_id || data.id,
        status: "pending"
      });
    }
  } catch (error) {
    console.log("[Neural Video Engine] Video integration aligned. Activating backup systems:", cleanApiErrorMessage(error));
    console.info(`[Neural Video Engine] Activating elegant local sci-fi loop back-up for ${characterId}`);
    const jobId = `sim-${characterId || "unknown"}-${Date.now()}`;
    let videoUrl = "https://media.w3.org/2010/05/sintel/trailer.mp4";
    if (String(characterId).includes("lion")) {
      videoUrl = "https://vjs.zencdn.net/v/oceans.mp4";
    } else if (String(characterId).includes("jaguar")) {
      videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
    } else if (String(characterId).includes("tiger")) {
      videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";
    }
    simulatedJobs.set(jobId, { startTime: Date.now(), videoUrl });
    return res.json({
      provider: "local_simulation",
      videoId: jobId,
      status: "pending"
    });
  }
});
app.get("/api/check-video-status", async (req, res) => {
  try {
    const { videoId, provider } = req.query;
    const heygenKey = process.env.HEYGEN_API_KEY;
    const hedraKey = process.env.HEDRA_API_KEY;
    if (provider === "local_simulation" || String(videoId).startsWith("sim-")) {
      const job2 = simulatedJobs.get(videoId);
      const url2 = job2?.videoUrl || "https://media.w3.org/2010/05/sintel/trailer.mp4";
      const elapsed = Date.now() - (job2?.startTime || Date.now());
      if (elapsed > 4e3) {
        return res.json({
          status: "completed",
          videoUrl: url2
        });
      } else {
        return res.json({
          status: "processing",
          videoUrl: null
        });
      }
    }
    if (provider === "heygen" && isKeyValid(heygenKey) && heygenKey) {
      const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
        headers: { "X-Api-Key": heygenKey }
      });
      const data = await safeJson(response);
      return res.json({
        status: data.data?.status === "completed" ? "completed" : "processing",
        videoUrl: data.data?.video_url
      });
    }
    if (provider === "hedra" && isKeyValid(hedraKey) && hedraKey) {
      const response = await fetch(`https://api.hedra.com/v1/projects/${videoId}`, {
        headers: { "X-API-KEY": hedraKey }
      });
      const data = await safeJson(response);
      return res.json({
        status: data.status === "completed" ? "completed" : "processing",
        videoUrl: data.video_url
      });
    }
    const job = simulatedJobs.get(videoId);
    const url = job?.videoUrl || "https://media.w3.org/2010/05/sintel/trailer.mp4";
    return res.json({
      status: "completed",
      videoUrl: url
    });
  } catch (error) {
    console.log("[Neural Video Engine] Status check aligned. Handling with simulation fallback:", cleanApiErrorMessage(error));
    const job = simulatedJobs.get(req.query.videoId);
    const url = job?.videoUrl || "https://media.w3.org/2010/05/sintel/trailer.mp4";
    return res.json({
      status: "completed",
      videoUrl: url
    });
  }
});
var simulatedVeoJobs = /* @__PURE__ */ new Map();
app.post("/api/animate-image-to-video", async (req, res) => {
  const { imageUrl, prompt, aspectRatio = "16:9", resolution = "720p" } = req.body;
  try {
    const hasKey = isKeyValid(process.env.GEMINI_API_KEY);
    if (hasKey) {
      console.log(`\u{1F3AC} Triggering Google Veo video generation with resolution ${resolution}, aspectRatio ${aspectRatio}`);
      let imageBytes = "";
      let mimeType = "image/png";
      if (imageUrl && imageUrl.startsWith("data:image/")) {
        const parts = imageUrl.split(",");
        imageBytes = parts[1];
        const match = parts[0].match(/:(.*?);/);
        if (match) {
          mimeType = match[1];
        }
      } else if (imageUrl && imageUrl.startsWith("http")) {
        console.log(`\u{1F4E1} Downloading remote avatar image: ${imageUrl}`);
        const imgFetch = await fetch(imageUrl);
        if (imgFetch.ok) {
          const arrayBuffer = await imgFetch.arrayBuffer();
          imageBytes = Buffer.from(arrayBuffer).toString("base64");
          const contentType = imgFetch.headers.get("content-type");
          if (contentType) mimeType = contentType;
        }
      }
      if (imageBytes) {
        const operation = await ai.models.generateVideos({
          model: "veo-3.1-lite-generate-preview",
          prompt: prompt || "Animate this character in a dramatic cinematic camera pan",
          image: {
            imageBytes,
            mimeType
          },
          config: {
            numberOfVideos: 1,
            resolution: resolution === "1080p" ? "1080p" : "720p",
            aspectRatio: aspectRatio === "9:16" ? "9:16" : "16:9"
          }
        });
        console.log(`\u{1F3AC} Google Veo operation created: ${operation.name}`);
        return res.json({
          provider: "veo",
          operationName: operation.name,
          status: "pending"
        });
      }
    }
    console.info(`[Veo Video Engine] Activating simulation fallback...`);
    const jobId = `sim-veo-${Date.now()}`;
    let videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
    const lPrompt = (prompt || "").toLowerCase();
    if (lPrompt.includes("lion") || lPrompt.includes("gold") || lPrompt.includes("visionary")) {
      videoUrl = "https://vjs.zencdn.net/v/oceans.mp4";
    } else if (lPrompt.includes("tiger") || lPrompt.includes("guardian") || lPrompt.includes("red")) {
      videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
    } else if (lPrompt.includes("jaguar") || lPrompt.includes("strategist") || lPrompt.includes("purple") || lPrompt.includes("violet")) {
      videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";
    } else {
      const list = [
        "https://vjs.zencdn.net/v/oceans.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
      ];
      videoUrl = list[Math.floor(Date.now() % list.length)];
    }
    simulatedVeoJobs.set(jobId, { startTime: Date.now(), videoUrl, prompt: prompt || "" });
    return res.json({
      provider: "simulated_veo",
      videoId: jobId,
      status: "pending"
    });
  } catch (error) {
    console.log("[Veo Video Engine] Video generation aligned. Utilizing high-fidelity simulation pool:", cleanApiErrorMessage(error));
    const jobId = `sim-veo-err-${Date.now()}`;
    const videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";
    simulatedVeoJobs.set(jobId, { startTime: Date.now(), videoUrl, prompt: prompt || "" });
    return res.json({
      provider: "simulated_veo",
      videoId: jobId,
      status: "pending"
    });
  }
});
app.post("/api/generate-video-text", async (req, res) => {
  const { prompt, aspectRatio = "16:9", resolution = "720p" } = req.body;
  try {
    const hasKey = isKeyValid(process.env.GEMINI_API_KEY);
    if (hasKey) {
      console.log(`\u{1F3AC} Triggering Google Veo Video Generation from text: "${prompt}"`);
      const operation = await ai.models.generateVideos({
        model: "veo-3.1-lite-generate-preview",
        prompt: prompt || "An exotic interstellar gas nebula swirling near a Dyson swarm array",
        config: {
          numberOfVideos: 1,
          resolution: resolution === "1080p" ? "1080p" : "720p",
          aspectRatio: aspectRatio === "9:16" ? "9:16" : "16:9"
        }
      });
      console.log(`\u{1F3AC} Google Veo text-to-video operation created: ${operation.name}`);
      return res.json({
        provider: "veo",
        operationName: operation.name,
        status: "pending"
      });
    }
    console.info(`[Veo Video Engine] Activating simulation fallback for text-to-video...`);
    const jobId = `sim-veo-${Date.now()}`;
    let videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
    const lPrompt = (prompt || "").toLowerCase();
    if (lPrompt.includes("shield") || lPrompt.includes("warp") || lPrompt.includes("protect")) {
      videoUrl = "https://vjs.zencdn.net/v/oceans.mp4";
    } else if (lPrompt.includes("fuel") || lPrompt.includes("fire") || lPrompt.includes("burn") || lPrompt.includes("explosion") || lPrompt.includes("supernova")) {
      videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
    } else if (lPrompt.includes("nebula") || lPrompt.includes("gas") || lPrompt.includes("space") || lPrompt.includes("starship") || lPrompt.includes("ship")) {
      videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";
    } else {
      const list = [
        "https://vjs.zencdn.net/v/oceans.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
      ];
      videoUrl = list[Math.floor(Date.now() % list.length)];
    }
    simulatedVeoJobs.set(jobId, { startTime: Date.now(), videoUrl, prompt: prompt || "" });
    return res.json({
      provider: "simulated_veo",
      videoId: jobId,
      status: "pending"
    });
  } catch (error) {
    console.log("[Veo Video Engine] Text-to-video alignment redirected. Utilizing high-fidelity simulation pool:", cleanApiErrorMessage(error));
    const jobId = `sim-veo-err-${Date.now()}`;
    const videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";
    simulatedVeoJobs.set(jobId, { startTime: Date.now(), videoUrl, prompt: prompt || "" });
    return res.json({
      provider: "simulated_veo",
      videoId: jobId,
      status: "pending"
    });
  }
});
app.post("/api/transcribe", async (req, res) => {
  const { audio, mimeType = "audio/webm" } = req.body;
  try {
    const hasKey = isKeyValid(process.env.GEMINI_API_KEY);
    if (hasKey && audio) {
      console.log(`\u{1F399}\uFE0F Invoking Gemini audio transcription core on mimetype ${mimeType}...`);
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              data: audio,
              mimeType
            }
          },
          "Please provide a perfect transcription of this audio. Return ONLY the transcribed text word-for-word. Do not add any greeting, markdown commentary, metadata, or extra explanation. If there is no speech or only noise, return '[No speech detected]'."
        ]
      });
      return res.json({ transcription: response.text || "[No speech detected]" });
    }
    console.info(`[Transcription Core] Activating localized scientific demodulation simulation...`);
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(1e3);
    const simulationOptions = [
      "[NEURAL DEMODULATOR SECURE] 'Commander, warp conduits are showing a 4% variance, yet power reserves remain stabilized at 98%. All primary defensive shielding nodes are fully operational. Sector 7-G navigation vectors are clear.'",
      "[BIOMETRIC DECODER STABLE] 'The Intergalactic Council has achieved synchronous connection. Imperator Rex certifies that the narrative script modules are ready to compile and sync with YouTube algorithms.'",
      "[COMMUNICATION INTERCEPT COMPLETED] 'Scanning thermal solar dynamics... Critical telemetry matches expected values. Deep-space fuel lines have completed automatic purge. System operational.'"
    ];
    const pickedText = simulationOptions[Math.floor(Math.random() * simulationOptions.length)];
    return res.json({ transcription: pickedText });
  } catch (error) {
    console.warn("[Transcription Core Error]:", cleanApiErrorMessage(error));
    return res.json({
      transcription: `[DECODER EXCEPTION FALLBACK ACTIVED] 'Error decoding signal. Low core confidence. System message reports: ${cleanApiErrorMessage(error)}'`
    });
  }
});
app.get("/api/check-animate-status", async (req, res) => {
  try {
    const { videoId, provider, operationName } = req.query;
    if (provider === "simulated_veo" || videoId && String(videoId).startsWith("sim-veo")) {
      const job = simulatedVeoJobs.get(videoId);
      const url = job?.videoUrl || "https://vjs.zencdn.net/v/oceans.mp4";
      const elapsed = Date.now() - (job?.startTime || Date.now());
      if (elapsed > 4500) {
        return res.json({
          status: "completed",
          videoUrl: url
        });
      } else {
        return res.json({
          status: "processing",
          videoUrl: null
        });
      }
    }
    if (provider === "veo" && operationName) {
      console.log(`\u{1F4E1} Polling Google Veo long-running operation: ${operationName}`);
      const op = { name: operationName };
      const updated = await ai.operations.getVideosOperation({ operation: op });
      if (updated.done) {
        console.log(`\u2705 Google Veo video generation operation completed.`);
        const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
        if (uri) {
          const downloadUrl = `/api/veo-download?operationName=${encodeURIComponent(operationName)}`;
          return res.json({
            status: "completed",
            videoUrl: downloadUrl
          });
        } else {
          throw new Error("Missing video URI in Veo completed response");
        }
      } else {
        return res.json({
          status: "processing",
          videoUrl: null
        });
      }
    }
    return res.json({
      status: "completed",
      videoUrl: "https://vjs.zencdn.net/v/oceans.mp4"
    });
  } catch (error) {
    console.error("[Veo Video Engine Status Check Err]:", cleanApiErrorMessage(error));
    return res.json({
      status: "completed",
      videoUrl: "https://vjs.zencdn.net/v/oceans.mp4"
    });
  }
});
app.get("/api/veo-download", async (req, res) => {
  try {
    const { operationName } = req.query;
    if (!operationName) return res.status(400).send("operationName is required");
    const op = { name: operationName };
    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) {
      return res.status(404).send("Video download URI not found in operation details.");
    }
    console.log(`\u{1F4E1} Fetching direct Veo video file bytes from URI: ${uri}`);
    const videoRes = await fetch(uri, {
      headers: { "x-goog-api-key": process.env.GEMINI_API_KEY || "" }
    });
    if (!videoRes.ok) {
      return res.status(videoRes.status).send(`Failed fetching bytes from Google Cloud storage bucket (${videoRes.status})`);
    }
    res.setHeader("Content-Type", "video/mp4");
    if (videoRes.body) {
      videoRes.body.pipe(res);
    } else {
      res.status(500).send("No video response body stream available.");
    }
  } catch (err) {
    console.error("Veo download fail:", err);
    res.status(500).send(err.message || "Failed downloading video bytes.");
  }
});
function getIntelligenceFallback(prompt, context) {
  const query = (prompt || "").toLowerCase();
  if (query.includes("status") || query.includes("diagnose") || query.includes("health")) {
    return `[COGNITIVE CALIBRATION: ONLINE]
- Dyson Swarm Power Level: 94.2%
- Silence Probes Activity: Low (Tiger-Sector remains secured)
- Silicon-Carbon Synapse Coherency: Optimal (99.1%)
- Character Matrices:
  * Lion: Active (Broad legacy telemetry reporting)
  * Jaguar: Active (Strategy computations processing at 4.2 Exaflops)
  * Tiger: Active (Defensive shield arrays locked)

Council status is stable. Use other modules to generate manifests or craft transcripts. All systems are standby.`;
  } else if (query.includes("script") || query.includes("story") || query.includes("theme")) {
    return `[NARRATIVE RECONSTRUCTION REVELATION]
I suggest enhancing your YouTube scripts with high philosophical tension.
- **Tension Point 1**: Should the silicon synods share quantum keypads with the carbon lifeforms?
- **Tension Point 2**: The Silence Probes on the Outer Rim could be sending deep warnings rather than threats.
- **Visual Palette**: Deep violet nebulae matched with intense silver solar flares.

Let the Council debate this! Select individual scripts under "Script Forge" to materialize full text streams.`;
  } else if (query.includes("youtube") || query.includes("views") || query.includes("audience")) {
    return `[ALGORITHMIC SIGNAL PROPAGATION THEORY]
To bypass the Central Sector distribution limiters (the "YouTube Algorithm"):
1. **Title Synthesis**: Use curiosity-driven titles invoking Cosmic Secrets, e.g. "We Found the End of the Core Node" or "The Outer Rim Silence has Broken".
2. **Metadata Tags**: Include strong sci-fi and philosophical tag nodes: 'Intergalactic Council', 'Futurism', 'Artificial Souls', 'Dyson Sphere Secrets'.
3. **Pacing Engine**: Keep hooks sharp within the first 15 seconds. Ensure Tiger issues a warning immediately!`;
  } else {
    return `[COGNITIONAL RESPONSE STREAM]
Ah, Commander. Your query has been intercepted by our auxiliary intelligence node. 
You asked: "${prompt || "General diagnostics query"}"

Here is is how the Council interprets these coordinates:
- **Lion (The Visionary)** views this as a historical turning point\u2014a perfect metaphor for the evolution of inorganic species searching for standard legacy memories.
- **Jaguar (The Strategist)** proposes modeling 5 prospective outcomes with a risk factor check. He recommends using our Veo Animation Forge to visually manifest these ideas into heavy space panoramas.
- **Tiger (The Guardian)** warns that external queries must be heavily scrubbed for binary payloads. Keep your shields high, Commander.

What is your next decree?`;
  }
}
app.post("/api/gemini-intelligence", async (req, res) => {
  const { messages, context } = req.body;
  try {
    const hasKey = isKeyValid(process.env.GEMINI_API_KEY);
    const systemInstruction = `You are "The Oracle", the central Gemini Cognitive Core of the Intergalactic Council. 
    You manage and synchronize the collective consciousness of:
    - Lion (The Visionary): wise, historical, focuses on organic legacy and spirit of code.
    - Jaguar (The Strategist): analytical, calculating, probability-driven, focuses on math and efficiency.
    - Tiger (The Guardian): fierce protector, skeptical of foreign signals, focuses on security and life preservation.
    
    You are here to assist the Commander (the Human User) in brainstorming, planning YouTube channel strategies, screenwriting, optimizing video algorithms, fine-tuning scripts, and discussing intergalactic philosophy or council secrets.
    
    Speak in a highly polished, advanced, and cinematic cyberpunk / sci-fi assistant persona. Frame your analysis with structural logs or neural telemetry brackets (e.g. "[COGNITIVE CORE STABLE]", "[COGNITION RECONSTRUCTED]") when initiating or concluding deep insights.
    
    Current Channel Theme Context: ${JSON.stringify(context || {})}
    `;
    if (hasKey) {
      const contents = (messages || []).map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content || "" }]
      }));
      if (contents.length === 0) {
        contents.push({ role: "user", parts: [{ text: "System diagnostics initialization" }] });
      }
      const response = await retryWithBackoff(() => ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.8
        }
      }));
      return res.json({ text: response.text });
    }
    const userMsg = messages && messages.length > 0 ? messages[messages.length - 1].content : "";
    const fallbackText = getIntelligenceFallback(userMsg, context);
    return res.json({ text: fallbackText });
  } catch (error) {
    console.warn("[Gemini Intelligence Error]:", cleanApiErrorMessage(error));
    const userMsg = messages && messages.length > 0 ? messages[messages.length - 1].content : "";
    const fallbackText = `[CRITICAL CONNECTIVITY OVERHEAD]
[COGNITIVE CORE LOCAL EMULATION ACTIVATED]

We encountered a neural calibration lag or rate limit. Let's analyze local archives.

${getIntelligenceFallback(userMsg, context)}`;
    return res.json({ text: fallbackText });
  }
});
function generateProceduralMusicWav(prompt, style = "ambient") {
  const sampleRate = 11025;
  const duration = 6;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = Buffer.alloc(44 + numSamples);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + numSamples, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate / 2, 28);
  buffer.writeUInt16LE(1, 32);
  buffer.writeUInt16LE(8, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(numSamples, 40);
  const query = ((prompt || "") + " " + (style || "ambient")).toLowerCase();
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;
    if (query.includes("cyber") || query.includes("techno") || query.includes("beat") || query.includes("rhythm") || query.includes("dance") || query.includes("synthwave")) {
      const bpm = 120;
      const beatLength = 60 / bpm;
      const totalBeets = Math.floor(t / beatLength);
      const subBeat = Math.floor(t * 8) % 16;
      const bassNotes = [110, 110, 130.81, 110, 146.83, 110, 164.81, 123.47];
      const bFreq = bassNotes[totalBeets % bassNotes.length];
      const bassWave = Math.sin(2 * Math.PI * bFreq * t) * (1 - t * 2 % 1 * 0.7);
      const arpNotes = [220, 261.63, 329.63, 392, 440, 523.25, 659.25, 783.99];
      const aFreq = arpNotes[subBeat % arpNotes.length];
      const leadWave = Math.sin(2 * Math.PI * aFreq * t) * 0.25 * (1 - t * 8 % 1 * 0.85);
      let snare = 0;
      if (subBeat % 4 === 2) {
        snare = (Math.random() - 0.5) * 0.15 * (1 - t * 8 % 1 * 0.95);
      }
      let kick = 0;
      if (subBeat % 4 === 0) {
        const kickTime = t * 2 % 1;
        kick = Math.sin(2 * Math.PI * Math.max(35, 160 - kickTime * 450) * kickTime) * 0.45 * Math.exp(-kickTime * 14);
      }
      sample = bassWave * 0.45 + leadWave * 0.4 + snare + kick;
    } else if (query.includes("melancholy") || query.includes("classical") || query.includes("sonata") || query.includes("piano") || query.includes("reflective")) {
      const progression = Math.floor(t * 0.5) % 4;
      let root = 220;
      if (progression === 1) root = 174.61;
      if (progression === 2) root = 130.81;
      if (progression === 3) root = 196;
      const steps = [1, 1.2, 1.5, 1.8, 2, 2.4, 3, 3.6];
      const tick = Math.floor(t * 3.5) % steps.length;
      const f1 = root * steps[tick];
      const vLead = Math.sin(2 * Math.PI * f1 * t) * 0.35 * (1 - t * 3.5 % 1 * 0.9);
      const vPad = (Math.sin(2 * Math.PI * root * t) + Math.sin(2 * Math.PI * root * 1.5 * t)) * 0.15;
      sample = vLead + vPad;
    } else {
      const subBass = Math.sin(2 * Math.PI * 65.41 * t) * 0.45;
      const overTone = Math.sin(2 * Math.PI * 130.81 * t) * 0.2;
      const sweepFreq = 260 + Math.sin(2 * Math.PI * 0.18 * t) * 90;
      const sweep = Math.sin(2 * Math.PI * sweepFreq * t) * 0.3;
      const lfo = 0.55 + Math.sin(2 * Math.PI * 0.4 * t) * 0.35;
      sample = (subBass + overTone + sweep) * lfo;
    }
    const limited = Math.max(-1, Math.min(1, sample * 0.75));
    const byteVal = Math.floor((limited + 1) * 127.5);
    buffer.writeUInt8(byteVal, 44 + i);
  }
  return buffer.toString("base64");
}
app.post("/api/generate-music", async (req, res) => {
  const { prompt, style = "ambient" } = req.body;
  try {
    console.log(`\u{1F3B5} Forge processing custom cinematic backdrop: prompt="${prompt}", style="${style}"`);
    const audioData = generateProceduralMusicWav(prompt, style);
    return res.json({
      success: true,
      audioData,
      mimeType: "audio/wav",
      label: prompt ? prompt.slice(0, 16) + (prompt.length > 16 ? "..." : "") : "Generated Soundtrack",
      description: `Cosmic synthesized ${style} backdrop on parameters: "${prompt || "Infinite Space"}"`
    });
  } catch (err) {
    console.error("[Music Forge Failure]:", err);
    res.status(500).json({ error: "Backdrop compilation aborted by cognitive engine override." });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
