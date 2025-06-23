import os
import uuid
import ffmpeg
from flask import Flask, request, render_template, send_from_directory

app = Flask(__name__)
UPLOAD_FOLDER = "static/audio"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        file = request.files.get("file")
        if file and file.filename.endswith(".flac"):
            unique_id = uuid.uuid4().hex
            flac_filename = f"{unique_id}.flac"
            wav_a_filename = f"{unique_id}_a.wav"
            wav_b_filename = f"{unique_id}_b.wav"

            flac_path = os.path.join(UPLOAD_FOLDER, flac_filename)
            wav_a_path = os.path.join(UPLOAD_FOLDER, wav_a_filename)
            wav_b_path = os.path.join(UPLOAD_FOLDER, wav_b_filename)

            # Save uploaded FLAC
            file.save(flac_path)

            # Convert to original quality WAV (lossless)
            ffmpeg.input(flac_path).output(wav_a_path).run(overwrite_output=True, quiet=True)

            # Convert to compressed WAV (simulate lossy)
            ffmpeg.input(flac_path).output(wav_b_path, audio_bitrate="128k").run(overwrite_output=True, quiet=True)

            return render_template(
                "index.html",
                wav_a=f"/{wav_a_path}",
                wav_b=f"/{wav_b_path}",
                flac_base=flac_filename.replace(".flac", "")
            )

    return render_template("index.html", wav_a=None, wav_b=None, flac_base=None)

@app.route("/static/audio/<path:filename>")
def audio(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == "__main__":
    app.run(debug=True)
