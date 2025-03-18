import * as React from 'react';
import { Editor } from '@tinymce/tinymce-react';
import Box from '@mui/material/Box';

export default function ProductEditor({ description, setDescription }) {
  return (
    <Box>
      <Editor
        tinymceScriptSrc="https://cdn.jsdelivr.net/npm/tinymce@5.10.2/tinymce.min.js"
        value={description}
        onEditorChange={(content) => setDescription(content)}
        init={{
          height: 500,
          menubar: true,
          plugins: [
            'advlist autolink lists link image charmap print preview anchor',
            'searchreplace visualblocks code fullscreen',
            'insertdatetime media table paste code help wordcount'
          ],
          toolbar: `undo redo | formatselect | bold italic backcolor | 
                    alignleft aligncenter alignright alignjustify | 
                    bullist numlist outdent indent | removeformat | help`
        }}
      />
    </Box>
  );
}
