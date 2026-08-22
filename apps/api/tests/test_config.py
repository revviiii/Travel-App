from pathlib import Path

from app.core.config import find_repository_root


def test_find_repository_root_uses_project_markers(tmp_path: Path) -> None:
    repository = tmp_path / "repository"
    config_file = repository / "apps" / "api" / "app" / "core" / "config.py"
    config_file.parent.mkdir(parents=True)
    config_file.touch()
    (repository / ".env.example").touch()
    (repository / "supabase").mkdir()

    assert find_repository_root(config_file) == repository


def test_find_repository_root_falls_back_for_container_layout(
    tmp_path: Path,
    monkeypatch,
) -> None:
    container_root = tmp_path / "container"
    config_file = container_root / "app" / "core" / "config.py"
    config_file.parent.mkdir(parents=True)
    config_file.touch()
    monkeypatch.chdir(container_root)

    assert find_repository_root(config_file) == container_root
