for i in *.wav; do ffmpeg -i "$i" "${i%.*}.mp3"; done
