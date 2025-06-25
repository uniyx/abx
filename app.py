import os
import uuid
import random
import ffmpeg
from flask import Flask, request, render_template, send_from_directory

app = Flask(__name__)
UPLOAD_FOLDER = "static/audio"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        file = request.files.get("file")
        trials = int(request.form.get("trials", 5))

        if file and file.filename.lower().endswith(".flac"):
            unique_id = uuid.uuid4().hex
            flac_filename = f"{unique_id}.flac"
            original_wav = f"{unique_id}_original.wav"
            compressed_mp3 = f"{unique_id}_compressed.mp3"
            compressed_wav = f"{unique_id}_compressed.wav"
            output_A = f"{unique_id}_A.wav"
            output_B = f"{unique_id}_B.wav"

            flac_path = os.path.join(UPLOAD_FOLDER, flac_filename)
            original_path = os.path.join(UPLOAD_FOLDER, original_wav)
            compressed_mp3_path = os.path.join(UPLOAD_FOLDER, compressed_mp3)
            compressed_path = os.path.join(UPLOAD_FOLDER, compressed_wav)
            A_path = os.path.join(UPLOAD_FOLDER, output_A)
            B_path = os.path.join(UPLOAD_FOLDER, output_B)

            # Save original FLAC
            file.save(flac_path)

            # Convert to high-quality WAV (original)
            ffmpeg.input(flac_path).output(original_path).run(overwrite_output=True, quiet=True)

            # Compress to MP3 (low bitrate)
            ffmpeg.input(flac_path).output(compressed_mp3_path, audio_bitrate="64k").run(overwrite_output=True, quiet=True)

            # Re-expand MP3 to WAV
            ffmpeg.input(compressed_mp3_path).output(compressed_path).run(overwrite_output=True, quiet=True)

            # Randomly assign A and B
            if random.choice([True, False]):
                os.rename(original_path, A_path)
                os.rename(compressed_path, B_path)
            else:
                os.rename(original_path, B_path)
                os.rename(compressed_path, A_path)

            # Optionally: remove intermediate files
            os.remove(flac_path)
            os.remove(compressed_mp3_path)

            return render_template(
                "index.html",
                flac_base = unique_id,
                filename = file.filename,
                trials = trials
            )

    return render_template("index.html", flac_base=None, trials=5)

@app.route("/static/audio/<path:filename>")
def audio(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == "__main__":
    app.run(debug=True)
