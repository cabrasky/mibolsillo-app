"""Photo service: cifrado Fernet + almacenamiento de fotos de gastos.

Las fotos se guardan cifradas en disco (dir configurable) y se
descifran en memoria al servirlas. Sin esta clave, la app no arranca.
"""
import os
from functools import lru_cache
from pathlib import Path

from fastapi import HTTPException
from fastapi.responses import FileResponse, Response
from fastapi import UploadFile

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_BYTES = 15 * 1024 * 1024  # 15 MB


class PhotoService:
    def __init__(self, key: bytes, directory: str):
        self.directory = Path(directory)
        self.directory.mkdir(parents=True, exist_ok=True)
        try:
            from cryptography.fernet import Fernet
            self.fernet = Fernet(key)
        except Exception as e:
            raise RuntimeError(f"photo key inválida: {e}") from e

    # ── helpers ─────────────────────────────────────────────
    def _path_for(self, user_id: str, expense_id: str) -> Path:
        return self.directory / f"{user_id}_{expense_id}.enc"

    def has_photo(self, user_id: str, expense_id: str) -> bool:
        return self._path_for(user_id, expense_id).exists()

    # ── mutaciones ─────────────────────────────────────────
    async def store(self, user_id: str, expense_id: str, file: UploadFile) -> None:
        ctype = (file.content_type or "").lower()
        if ctype not in ALLOWED_TYPES:
            raise HTTPException(status_code=400, detail="Tipo no permitido (solo jpeg/png/webp)")
        data = await file.read()
        if not data:
            raise HTTPException(status_code=400, detail="Archivo vacío")
        if len(data) > MAX_BYTES:
            raise HTTPException(status_code=400, detail="Máximo 15 MB")
        token = self.fernet.encrypt(data)
        path = self._path_for(user_id, expense_id)
        tmp = path.with_suffix(".tmp")
        tmp.write_bytes(token)
        os.replace(tmp, path)  # atómico: no dejas a medias

    def delete(self, user_id: str, expense_id: str) -> bool:
        path = self._path_for(user_id, expense_id)
        if path.exists():
            path.unlink()
            return True
        return False

    # ── lectura ────────────────────────────────────────────
    def get_response(self, user_id: str, expense_id: str, original_type: str | None) -> Response:
        path = self._path_for(user_id, expense_id)
        if not path.exists():
            raise HTTPException(status_code=404, detail="Sin foto")
        data = self.fernet.decrypt(path.read_bytes())
        media_type = original_type if original_type in ALLOWED_TYPES else "application/octet-stream"
        return Response(content=data, media_type=media_type,
                        headers={"Cache-Control": "private, max-age=0"})


def safe_delete_photo(user_id: str, expense_id: str) -> None:
    """Borrar el fichero de foto sin ruido (al borrar el gasto)."""
    try:
        svc = _default_service()
        if svc:
            svc.delete(user_id, expense_id)
    except Exception:
        pass


@lru_cache
def _default_service() -> PhotoService | None:
    key_path = os.path.expanduser("~/.hermes/secrets/mibolsillo/photo-key.txt")
    if not os.path.exists(key_path):
        return None
    try:
        key = Path(key_path).read_text().strip().encode()
    except OSError:
        raise HTTPException(status_code=500, detail="Servidor sin clave de fotos (revisa configuración)")
    upload_dir = os.environ.get("PHOTO_DIR") or os.path.expanduser("~/.hermes/uploads/mibolsillo")
    return PhotoService(key, upload_dir)


def get_photo_service() -> PhotoService:
    svc = _default_service()
    if svc is None:
        raise HTTPException(status_code=503, detail="Fotos deshabilitadas en este servidor (falta la clave de cifrado)")
    return svc
