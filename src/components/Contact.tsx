import React from "react";

export default function Contact() {
  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Contact the Builder</h1>
      <form
        name="builder-contact"
        method="POST"
        data-netlify="true"
        className="space-y-4"
      >
        <input type="hidden" name="form-name" value="builder-contact" />
        <label className="block">
          Your Message Should Include Your Contact Information As It Is Not Automatically Recorded
          <textarea
            name="message"
            required
            className="w-full border rounded p-2"
          />
        </label>
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </form>
    </div>
  );
}
