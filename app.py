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
            mp3_filename = f"{unique_id}.mp3"
            flac_path = os.path.join(UPLOAD_FOLDER, flac_filename)
            mp3_path = os.path.join(UPLOAD_FOLDER, mp3_filename)

            file.save(flac_path)

            # Convert using ffmpeg-python
            ffmpeg.input(flac_path).output(mp3_path, audio_bitrate="320k").run(quiet=True, overwrite_output=True)

            return render_template("index.html", flac_file=f"/{flac_path}", mp3_file=f"/{mp3_path}")

    return render_template("index.html", flac_file=None, mp3_file=None)

@app.route("/static/audio/<path:filename>")
def audio(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == "__main__":
    app.run(debug=True)
