import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTimes } from "@fortawesome/free-solid-svg-icons";
import { Iteration } from "../../../@types/projects/types";

interface Props {
  // Define the props for your component here
  iteration: Iteration;
  index: number;
  name: string;
  updateIteration: (iteration: Iteration) => void;
}

const IterationDetailCard: React.FC<Props> = ({
  iteration,
  index,
  name,
  updateIteration,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedIteration, setEditedIteration] = useState(iteration);

  const handleEdit = () => {
    setIsEditing(true);
  };
  const handleSave = () => {
    console.log(editedIteration);
    updateIteration(editedIteration);
    setIsEditing(false);
  };

  // useEffect(() => {
  //   setEditedIteration(iteration);
  // }, [iteration]);

  return (
    <>
      {editedIteration ? (
        <div className="bg-white p-4 shadow rounded mt-5 border-gray-400">
          {!isEditing ? (
            <FontAwesomeIcon
              icon={faEdit}
              onClick={handleEdit}
              style={{ float: "right" }}
            />
          ) : (
            <FontAwesomeIcon
              icon={faTimes}
              onClick={() => setIsEditing(false)}
              style={{ float: "right" }}
            />
          )}

          <p className="text-lg font-bold text-blue-600">
            第{index + 1}次{name}
          </p>

          {isEditing ? (
            <div className="flex flex-col space-y-4">
              <label className="font-bold text-sm text-gray-600">
                开始时间
              </label>
              {editedIteration && (
                <input
                  className="border-2 border-gray-300 p-2 rounded-md text-sm"
                  type="datetime-local"
                  value={editedIteration.startTime.slice(0, 16)}
                  onChange={(e) =>
                    setEditedIteration({
                      ...editedIteration,
                      startTime: e.target.value,
                    })
                  }
                />
              )}
              <label className="font-bold text-sm text-gray-600">
                持续时间
              </label>
              <div className="flex items-center space-x-2">
                <input
                  className="border-2 border-gray-300 p-2 rounded-md"
                  type="number"
                  value={editedIteration.elapsedTime / 60}
                  onChange={(e) =>
                    setEditedIteration({
                      ...editedIteration,
                      elapsedTime: Number(e.target.value) * 60,
                    })
                  }
                />
                <span>分钟</span>
              </div>
              <label className="font-bold text-sm text-gray-600">评分</label>
              <input
                className="border-2 border-gray-300 p-2 rounded-md"
                type="number"
                min="1"
                max="5"
                value={editedIteration.quality}
                onChange={(e) =>
                  setEditedIteration({
                    ...editedIteration,
                    quality: Number(e.target.value),
                  })
                }
              />
              <label className="font-bold text-sm text-gray-600">小记</label>
              <textarea
                className="border-2 border-gray-300 p-2 rounded-md"
                value={editedIteration.notes}
                onChange={(e) => {
                  console.log(e.target.value);
                  setEditedIteration({
                    ...editedIteration,
                    notes: e.target.value,
                  });
                }}
              />
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          ) : (
            <>
              <p className="text-zinc-500">
                开始时间:{" "}
                {iteration.startTime
                  ? `${new Date(
                      iteration.startTime
                    ).toLocaleDateString()} ${new Date(
                      iteration.startTime
                    ).toLocaleTimeString()}`
                  : "未知"}
              </p>
              <p className="text-zinc-500">
                持续时间: {Math.floor(iteration.elapsedTime / 3600)} 小时{" "}
                {Math.floor((iteration.elapsedTime % 3600) / 60)} 分钟
              </p>
              <p className="text-zinc-500">评价: {iteration.quality}星</p>
              <p className="text-zinc-500">小记: {iteration.notes}</p>
            </>
          )}
        </div>
      ) : null}
    </>
  );
};

export default IterationDetailCard;
