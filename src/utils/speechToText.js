import { AssemblyAI } from "assemblyai";
import fs from "fs";


const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});


export async function transcribeAudio(audioPath) {
  try {
    console.log("Uploading audio to AssemblyAI...");

    // Step 1: Upload the audio file
    const audioUrl = await client.files.upload(fs.createReadStream(audioPath));
    console.log("File uploaded successfully:", audioUrl);




    // Step 2: Request transcription
    // ✅ Step 2: Request transcription
    const transcriptRequest = await client.transcripts.create({
      audio_url: audioUrl,
      language_detection: true,
      punctuate: true,
    });

    console.log("🕒 Transcription started... ID:", transcriptRequest.id);

    // ✅ Step 3: Poll until transcription is done
    let transcript;
    while (true) {
      transcript = await client.transcripts.get(transcriptRequest.id);

      if (transcript.status === "completed") {
        console.log("✅ Transcription completed!");
        return transcript.text;
      }

      if (transcript.status === "error") {
        throw new Error("Transcription failed: " + transcript.error);
      }

      // Wait 5 seconds before checking again
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  } catch (error) {
    console.error("Deepgram error:", error.response?.data || error.message);
    return error;
  }
}
