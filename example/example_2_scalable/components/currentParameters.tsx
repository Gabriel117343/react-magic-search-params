import React from 'react'

interface CurrentParametersProps {
  tags: string[];
  page: number;
  only_is_active: boolean;
  tagsWithoutConvert: string;
  order: string;
  search: string;
  onConvertStringBoolean?: (value: string) => boolean;
}

export const CurrentParameters = (props: CurrentParametersProps) => {
  const { only_is_active, order, page, search, tags, tagsWithoutConvert } = props;
  
  console.log("type only_is_active", typeof only_is_active);
  return (
    <div className="mb-6">
    <h3 className="text-lg font-semibold mb-3">Current Parameters:</h3>
    <div className="bg-gray-50 p-5 rounded-md shadow-inner dark:bg-zinc-900">
      <p>
        <strong>Page:</strong> {page}
      </p>
      <p>
        <strong>Page Size:</strong> {10}
      </p>
      <p>
        <strong>Only Active:</strong>{" "}
        {only_is_active ? "Yes" : "No"}
      </p>
      <p>
        <strong>Tags:</strong> {JSON.stringify(tags)}
      </p>
      <hr className="mt-2" />
      <small className="bg-yellow-300 rounded-sm p-0.5 dark:bg-cyan-600">
        Note: This is how they should be sent to the backend
      </small>
      <p>
        <strong>Tags without conversion:</strong>{" "}
        {JSON.stringify(tagsWithoutConvert)}
      </p>
      <p>
        <strong>Order:</strong> {order ?? "None"}
      </p>
      <p>
        <strong>Search:</strong> {search ?? "None"}
      </p>
    </div>
  </div>
  )
}
