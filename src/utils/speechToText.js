import fs from "fs";
import axios from "axios";



export async function transcribeAudio(audioPath) {
  try {
    const audioData = fs.readFileSync(audioPath);

    const response = await axios.post(
      "https://api.deepgram.com/v1/listen?detect_language=true&punctuate=true",
      audioData,
      {
        headers: {
          Authorization: 'Token e7d226f864b59db1613fe7e15c501dc68a3b98ce',
          "Content-Type": "audio/mp4",
        },
      }
    );
    const transcript = response.data.results.channels[0].alternatives[0].transcript;



    return transcript;
  } catch (error) {
    console.error("Deepgram error:", error.response?.data || error.message);
    return error;
  }
}
