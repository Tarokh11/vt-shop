"""Verify SSH script execution without a VPS or Docker daemon."""

import json
import os
import subprocess
import sys
import tempfile
import textwrap
import unittest
from pathlib import Path


class DeploymentWorkflowTests(unittest.TestCase):
    def remote_script(self):
        workflow = (
            Path(__file__).resolve().parents[1] / ".github/workflows/deploy.yml"
        ).read_text()
        return textwrap.dedent(
            workflow.split("<<'REMOTE'\n", 1)[1].split("\n          REMOTE", 1)[0]
        )

    def run_script(self, with_environment):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            app = root / "app"
            app.mkdir()
            if with_environment:
                (app / ".env.production").touch()
            binaries = root / "bin"
            binaries.mkdir()
            git = binaries / "git"
            git.write_text("#!/bin/sh\nexit 0\n")
            git.chmod(0o755)
            docker = binaries / "docker"
            docker.write_text(
                f"#!{sys.executable}\n"
                "import json, os, sys\n"
                "with open(os.environ['DOCKER_CALLS'], 'a') as f:\n"
                "    f.write(json.dumps(sys.argv[1:]) + '\\n')\n"
                "if any(c in sys.argv for c in ['run', 'exec']) "
                "and '--interactive=false' not in sys.argv:\n"
                "    sys.stdin.read()\n"
            )
            docker.chmod(0o755)
            log = root / "calls"
            env = dict(
                os.environ,
                PATH=f"{binaries}:{os.environ['PATH']}",
                PRODUCTION_PATH=str(app),
                REPOSITORY="https://example.invalid/repo.git",
                DEPLOY_BRANCH="vt-shop",
                DEPLOY_SHA="0" * 40,
                DOCKER_CALLS=str(log),
            )
            result = subprocess.run(
                ["bash", "-se"],
                input=self.remote_script(),
                env=env,
                text=True,
                capture_output=True,
                timeout=10,
                check=False,
            )
            calls = (
                [json.loads(line) for line in log.read_text().splitlines()]
                if log.exists()
                else []
            )
            return result, calls

    def test_all_commands_run_when_docker_would_consume_stdin(self):
        result, calls = self.run_script(with_environment=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(len(calls), 8)
        self.assertEqual(calls[-1][-1], "ps")
        self.assertTrue(any("collectstatic" in call for call in calls))
        self.assertTrue(any("check" in call for call in calls))

    def test_missing_production_environment_stops_before_docker(self):
        result, calls = self.run_script(with_environment=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn(".env.production", result.stdout)
        self.assertEqual(calls, [])
