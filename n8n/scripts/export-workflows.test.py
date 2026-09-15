"""ייצוא שנכשל חייב להשאיר את הגיבוי האחרון שלם, גם אם השרת החזיר JSON של שגיאה."""
import pathlib
import shutil
import subprocess
import tempfile
import unittest


class ExportTests(unittest.TestCase):
    def test_api_error_does_not_overwrite_backup(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            (root / 'scripts').mkdir()
            (root / 'workflows/exported').mkdir(parents=True)
            shutil.copy(pathlib.Path(__file__).with_name('export-workflows.sh'), root / 'scripts/export-workflows.sh')
            (root / 'scripts/load-env.sh').write_text(':\n')
            api = root / 'scripts/n8n-api.sh'
            api.write_text('''#!/usr/bin/env bash
if [[ "$2" == /workflows\\?* ]]; then
  printf '%s' '{"data":[{"id":"1","name":"Existing"}]}'
else
  printf '%s' '{"message":"Unauthorized"}'
fi
''')
            api.chmod(0o755)
            backup = root / 'workflows/exported/Existing.json'
            backup.write_text('{"backup":"keep"}\n')
            result = subprocess.run(['bash', str(root / 'scripts/export-workflows.sh')], capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(backup.read_text(), '{"backup":"keep"}\n')


if __name__ == '__main__':
    unittest.main()
